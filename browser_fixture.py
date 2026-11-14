"""Browser test fixture ONLY: simulate Gemini's HTTP response; never used by server.py.

Run: python browser_fixture.py; open http://localhost:8001.
"""
import io
import json
from http.server import ThreadingHTTPServer
from unittest.mock import patch
import server
from test_server import example_profile


def fixture_response(request, **kwargs):
    note = json.loads(request.data)['contents'][0]['parts'][0]['text']
    profile = example_profile()
    if 'Casey' in note:
        profile['name'] = 'Casey Morgan'
        profile['appearance'] = 'Blue jacket'
    if 'unnamed' in note:
        profile['name'] = ''
    response = {'candidates': [{'finishReason': 'STOP',
                               'content': {'parts': [{'text': json.dumps(profile)}]}}]}
    return io.BytesIO(json.dumps(response).encode())


if __name__ == '__main__':
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-only-not-a-real-key'}):
        with patch('server.urlopen', side_effect=fixture_response):
            print('TEST FIXTURE ONLY (simulated Gemini): http://localhost:8001', flush=True)
            ThreadingHTTPServer(('127.0.0.1', 8001), server.RolodexHandler).serve_forever()
