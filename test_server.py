"""Unit and HTTP integration tests; Gemini is mocked, no key or network needed."""
import io
import json
import os
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from http.server import ThreadingHTTPServer
import server


def example_profile():
    return {**{key: '' for key in server.FIELDS}, 'name': 'Jamie Rivera',
            'met': 'Rexburg hackathon', 'pronouns': 'they/them',
            'appearance': 'Red glasses', 'notes': 'Met at the Rexburg hackathon.',
            'events': ['Won a robotics contest'], 'tags': ['robotics']}


class FakeContactRepository:
    def __init__(self):
        self.contact = {'id': 'contact-1', 'owner_id': server.DEV_OWNER_ID,
                        'name': 'Jamie Rivera', 'role': None, 'met': None,
                        'city': None, 'phone': None, 'email': None, 'notes': None,
                        'gender': None, 'pronouns': None, 'appearance': None,
                        'events': [], 'tags': []}
        self.calls = []

    def create_contact(self, owner_id, profile, **kwargs):
        self.calls.append(('create', owner_id, profile, kwargs))
        return {**self.contact, **profile, 'owner_id': owner_id}

    def list_contacts(self, owner_id):
        self.calls.append(('list', owner_id))
        return [{**self.contact, 'owner_id': owner_id}]

    def get_contact(self, owner_id, contact_id):
        self.calls.append(('get', owner_id, contact_id))
        if contact_id != self.contact['id']:
            return None
        return {**self.contact, 'owner_id': owner_id}

    def update_contact(self, owner_id, contact_id, changes, **kwargs):
        self.calls.append(('update', owner_id, contact_id, changes, kwargs))
        if contact_id != self.contact['id']:
            from database.repository import ContactNotFound
            raise ContactNotFound('not found')
        self.contact.update(changes)
        if 'events' in kwargs and kwargs['events'] is not None:
            self.contact['events'] = kwargs['events']
        if 'tags' in kwargs and kwargs['tags'] is not None:
            self.contact['tags'] = kwargs['tags']


class ValidationTests(unittest.TestCase):
    def test_valid_profile(self):
        self.assertEqual(server.validate_profile(example_profile())['name'], 'Jamie Rivera')

    def test_unknown_fields_remain_empty(self):
        self.assertEqual(server.validate_profile(example_profile())['gender'], '')

    def test_invalid_fields_and_missing_name(self):
        for key, value in [('name', ''), ('gender', 10), ('events', 'wrong'), ('tags', [4])]:
            with self.subTest(key=key):
                profile = example_profile()
                profile[key] = value
                with self.assertRaises(ValueError):
                    server.validate_profile(profile)

    def test_contact_body_enforces_database_lengths(self):
        profile = example_profile()
        profile['email'] = 'x' * 321
        with self.assertRaisesRegex(ValueError, 'email is too long'):
            server.validate_contact_body(profile)

    def test_deduplicates_lists(self):
        profile = example_profile()
        profile['tags'] = ['robotics', 'robotics', ' ']
        self.assertEqual(server.validate_profile(profile)['tags'], ['robotics'])

    @patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key'})
    def test_provider_request_and_response(self):
        payload = {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [
            {'text': json.dumps(example_profile())}]}}]}
        with patch('server.urlopen', return_value=io.BytesIO(json.dumps(payload).encode())) as upstream:
            self.assertEqual(server.call_gemini('I met Jamie Rivera.'), example_profile())
            request = upstream.call_args.args[0]
            self.assertIn('generativelanguage.googleapis.com', request.full_url)
            self.assertEqual(json.loads(request.data)['contents'][0]['parts'][0]['text'], 'I met Jamie Rivera.')
            self.assertEqual(json.loads(request.data)['generationConfig']['maxOutputTokens'], 2048)

    @patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key'})
    def test_provider_incomplete_and_quota_error(self):
        with patch('server.urlopen', return_value=io.BytesIO(b'{"candidates": []}')):
            with self.assertRaisesRegex(RuntimeError, 'complete profile'):
                server.call_gemini('Jamie')
        with patch('server.urlopen', side_effect=HTTPError('test', 429, 'quota', {}, None)):
            with self.assertRaisesRegex(RuntimeError, 'quota'):
                server.call_gemini('Jamie')


class HttpTests(unittest.TestCase):
    def test_app_server_rejects_duplicate_listener(self):
        first = server.LocalHTTPServer(('127.0.0.1', 0), server.RolodexHandler)
        try:
            with self.assertRaises(OSError):
                server.LocalHTTPServer(first.server_address, server.RolodexHandler)
        finally:
            first.server_close()

    @classmethod
    def setUpClass(cls):
        cls.httpd = ThreadingHTTPServer(('127.0.0.1', 0), server.RolodexHandler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.httpd.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join()

    def post(self, body):
        request = Request(self.base + '/api/profile', data=json.dumps(body).encode(),
                          headers={'Content-Type': 'application/json'})
        try:
            response = urlopen(request)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response)

    def request_json(self, method, path, body=None):
        data = None if body is None else json.dumps(body).encode()
        request = Request(self.base + path, data=data, method=method,
                          headers={'Content-Type': 'application/json'} if data else {})
        try:
            response = urlopen(request)
        except HTTPError as error:
            response = error
        with response:
            return response.status, json.load(response)

    def test_empty_wrong_and_long_input(self):
        for body in ({'note': ''}, {'note': []}, [], {'note': 'a' * 8001}):
            self.assertEqual(self.post(body)[0], 400)

    @patch.dict(os.environ, {'GEMINI_API_KEY': ''})
    def test_missing_key(self):
        status, payload = self.post({'note': 'I met Jamie Rivera.'})
        self.assertEqual(status, 503)
        self.assertIn('not configured', payload['error'])

    def test_profile_twice(self):
        with patch('server.call_gemini', return_value=example_profile()) as mocked:
            for _ in range(2):
                status, payload = self.post({'note': 'I met Jamie Rivera.'})
                self.assertEqual(status, 200)
                self.assertEqual(payload['profile']['appearance'], 'Red glasses')
            self.assertEqual(mocked.call_count, 2)

    def test_assets_and_secret_paths(self):
        for path in ('/', '/app.js', '/styles.css', '/profile-api.mjs'):
            with urlopen(self.base + path) as response:
                self.assertEqual(response.status, 200)
        for path in ('/.env', '/.git/config', '/server.py', '/test_server.py', '/../.env'):
            with self.assertRaises(HTTPError) as caught:
                urlopen(self.base + path)
            self.assertEqual(caught.exception.code, 404)

    @patch.dict(os.environ, {'DB_HOST': 'db', 'DB_NAME': 'rolodexi',
                             'DB_USER': 'app', 'DB_PASSWORD': 'secret'})
    def test_contact_routes_use_repository_and_owner_scope(self):
        repository = FakeContactRepository()
        with patch('server.get_repository', return_value=repository):
            status, payload = self.request_json('POST', '/api/contacts',
                                                {**example_profile(), 'source_text': 'Met Jamie.'})
            self.assertEqual(status, 201)
            self.assertEqual(payload['contact']['id'], 'contact-1')
            self.assertEqual(repository.calls[0][1], server.DEV_OWNER_ID)
            self.assertEqual(repository.calls[0][3]['source_text'], 'Met Jamie.')

            status, payload = self.request_json('GET', '/api/contacts')
            self.assertEqual(status, 200)
            self.assertEqual(payload['contacts'][0]['owner_id'], server.DEV_OWNER_ID)

            status, payload = self.request_json('PATCH', '/api/contacts/contact-1',
                                                {'notes': 'Updated', 'events': []})
            self.assertEqual(status, 200)
            self.assertEqual(payload['contact']['notes'], 'Updated')
            update = repository.calls[-2]
            self.assertEqual(update[1], server.DEV_OWNER_ID)
            self.assertEqual(update[4]['events'], [])

    @patch.dict(os.environ, {'DB_HOST': 'db', 'DB_NAME': 'rolodexi',
                             'DB_USER': 'app', 'DB_PASSWORD': 'secret'})
    def test_missing_contact_is_not_reported_as_database_failure(self):
        repository = FakeContactRepository()
        with patch('server.get_repository', return_value=repository):
            status, payload = self.request_json('PATCH', '/api/contacts/missing', {'notes': 'x'})
        self.assertEqual(status, 404)
        self.assertEqual(payload['error'], 'Contact not found.')


if __name__ == '__main__':
    unittest.main()
