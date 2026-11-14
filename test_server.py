"""Unit and HTTP integration tests; Gemini is mocked, no key or network needed."""
import io
import json
import os
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
import server


def example_profile():
    return {**{key: '' for key in server.FIELDS}, 'name': 'Jamie Rivera',
            'met': 'Rexburg hackathon', 'pronouns': 'they/them',
            'appearance': 'Red glasses', 'notes': 'Met at the Rexburg hackathon.',
            'events': ['Won a robotics contest'], 'tags': ['robotics']}


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
    def setUp(self):
        self.app = server.create_app({'TESTING': True, 'PRODUCTION': False,
                                      'DEMO_ACCESS_CODE': '', 'PUBLIC_ORIGIN': '',
                                      'SECRET_KEY': 'local-test-secret', 'TRUST_PROXY': False})
        self.client = self.app.test_client()

    def post(self, body):
        response = self.client.post('/api/profile', json=body)
        return response.status_code, response.get_json()

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
        for path in ('/', '/app.js', '/styles.css', '/profile-api.mjs', '/street_valley_world.js', '/street_valley_characters.js'):
            with self.client.get(path) as response:
                self.assertEqual(response.status_code, 200)
        for path in ('/.env', '/.git/config', '/server.py', '/test_server.py', '/../.env', '/requirements.txt'):
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_live_server_preflight_and_response(self):
        for origin in ('http://localhost:5500', 'http://127.0.0.1:5500'):
            response = self.client.options('/api/profile', headers={'Origin':origin, 'Access-Control-Request-Method':'POST'})
            self.assertEqual(response.status_code,204)
            self.assertEqual(response.headers.getlist('Access-Control-Allow-Origin'),[origin])
            with patch('server.call_gemini',return_value=example_profile()):
                response = self.client.post('/api/profile', json={'note':'Jamie Rivera'}, headers={'Origin':origin})
                self.assertEqual(response.status_code,200)
                self.assertEqual(response.headers.getlist('Access-Control-Allow-Origin'),[origin])

    def test_untrusted_origins_are_rejected_before_gemini(self):
        for origin in ('https://example.com','null','http://localhost:5500.evil.example'):
            with patch('server.call_gemini') as upstream:
                response = self.client.post('/api/profile',json={'note':'Jamie'},headers={'Origin':origin})
                self.assertEqual(response.status_code,403)
                self.assertIsNone(response.headers.get('Access-Control-Allow-Origin'))
                upstream.assert_not_called()

    def test_body_type_size_and_malformed_json(self):
        self.assertEqual(self.client.post('/api/profile',data='hello').status_code,415)
        self.assertEqual(self.client.post('/api/profile',data='{bad',content_type='application/json').status_code,400)
        self.assertEqual(self.client.post('/api/profile',json={'note':'a'*70000}).status_code,413)

    def test_remote_development_access_is_rejected(self):
        self.assertEqual(self.client.get('/',environ_overrides={'REMOTE_ADDR':'10.0.0.5'}).status_code,403)
