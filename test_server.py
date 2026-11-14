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
        for path in ('/', '/app.js', '/styles.css'):
            with urlopen(self.base + path) as response:
                self.assertEqual(response.status, 200)
        for path in ('/.env', '/.git/config', '/server.py', '/test_server.py', '/../.env'):
            with self.assertRaises(HTTPError) as caught:
                urlopen(self.base + path)
            self.assertEqual(caught.exception.code, 404)


if __name__ == '__main__':
    unittest.main()
