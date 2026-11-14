import os
import re
import unittest
from unittest.mock import patch
import server
from test_server import example_profile


@patch.dict(os.environ, {'GEMINI_API_KEY':'test-only-upstream-key'})
class SecurityTests(unittest.TestCase):
    def test_single_instance_listener(self):
        with server.open_listener('127.0.0.1',0) as first:
            with self.assertRaises(OSError):
                server.open_listener('127.0.0.1',first.getsockname()[1])

    def make_app(self, **overrides):
        config = {'TESTING':True,'PRODUCTION':True,'PUBLIC_ORIGIN':'https://demo.example.com',
                  'DEMO_ACCESS_CODE':'test-only-access-code','SECRET_KEY':'test-only-secret-'*4,
                  'TRUST_PROXY':False}
        config.update(overrides)
        return server.create_app(config)

    def login(self, client):
        response = client.get('/login',base_url='https://demo.example.com')
        token = re.search(r'name="csrf" value="([^"]+)"',response.get_data(as_text=True)).group(1)
        response = client.post('/login',base_url='https://demo.example.com',
                               data={'csrf':token,'access_code':'test-only-access-code'})
        self.assertEqual(response.status_code,302)
        with client.session_transaction(base_url='https://demo.example.com') as state:
            return state['csrf'], response

    def test_production_configuration_fails_closed(self):
        for override in ({'SECRET_KEY':None},{'DEMO_ACCESS_CODE':'short'},{'PUBLIC_ORIGIN':'http://demo.example.com'}, {'DEMO_ACCESS_CODE':'test-only-upstream-key'}):
            with self.subTest(override=list(override)):
                with self.assertRaises(RuntimeError):
                    self.make_app(**override)

    def test_no_login_no_gemini(self):
        client=self.make_app().test_client()
        self.assertEqual(client.get('/',base_url='https://demo.example.com').status_code,302)
        with patch('server.call_gemini') as upstream:
            response=client.post('/api/profile',json={'note':'Jamie'},base_url='https://demo.example.com')
            self.assertEqual(response.status_code,401)
            self.assertEqual(response.json['code'],'AUTH_REQUIRED')
            upstream.assert_not_called()

    def test_login_csrf_and_cookie_flags(self):
        client=self.make_app().test_client()
        self.assertEqual(client.post('/login',data={'access_code':'test-only-access-code'},base_url='https://demo.example.com').status_code,403)
        token, response=self.login(client)
        cookie=response.headers['Set-Cookie']
        for flag in ('Secure','HttpOnly','SameSite=Strict'):
            self.assertIn(flag,cookie)
        html=client.get('/',base_url='https://demo.example.com').get_data(as_text=True)
        self.assertIn('name="csrf-token"',html)
        self.assertNotIn('test-only-upstream-key',html)
        self.assertNotIn('test-only-access-code',html)

    def test_authenticated_profile_csrf_logout_and_session_replay(self):
        client=self.make_app().test_client()
        token,_=self.login(client)
        with patch('server.call_gemini',return_value=example_profile()) as upstream:
            self.assertEqual(client.post('/api/profile',json={'note':'Jamie'},base_url='https://demo.example.com').status_code,403)
            upstream.assert_not_called()
            response=client.post('/api/profile',json={'note':'Jamie'},headers={'X-CSRF-Token':token,'Origin':'https://demo.example.com'},base_url='https://demo.example.com')
            self.assertEqual(response.status_code,200)
            self.assertEqual(response.json['profile']['name'],'Jamie Rivera')
        old_cookie = client.get_cookie('rolodexi_session',domain='demo.example.com').value
        self.assertEqual(client.post('/logout',headers={'X-CSRF-Token':token},base_url='https://demo.example.com').status_code,200)
        client.set_cookie('rolodexi_session', old_cookie, domain='demo.example.com')
        self.assertEqual(client.post('/api/profile',json={'note':'Jamie'},headers={'X-CSRF-Token':token},base_url='https://demo.example.com').status_code,401)

    def test_login_and_profile_rate_limits(self):
        app=self.make_app(API_RATE_LIMIT=2)
        client=app.test_client();token,_=self.login(client)
        with patch('server.call_gemini',return_value=example_profile()) as upstream:
            for _ in range(2):
                self.assertEqual(client.post('/api/profile',json={'note':'Jamie'},headers={'X-CSRF-Token':token},base_url='https://demo.example.com').status_code,200)
            response=client.post('/api/profile',json={'note':'Jamie'},headers={'X-CSRF-Token':token},base_url='https://demo.example.com')
            self.assertEqual(response.status_code,429)
            self.assertEqual(response.headers['Retry-After'],'60')
            self.assertEqual(upstream.call_count,2)
        client=self.make_app().test_client()
        page=client.get('/login',base_url='https://demo.example.com').get_data(as_text=True)
        csrf=re.search(r'name="csrf" value="([^"]+)"',page).group(1)
        for _ in range(5):
            self.assertEqual(client.post('/login',data={'csrf':csrf,'access_code':'wrong'},base_url='https://demo.example.com').status_code,401)
        self.assertEqual(client.post('/login',data={'csrf':csrf,'access_code':'wrong'},base_url='https://demo.example.com').status_code,429)

    def test_https_redirect_and_untrusted_proxy_headers(self):
        client=self.make_app().test_client()
        response=client.get('/',base_url='http://demo.example.com',headers={'X-Forwarded-Proto':'https'})
        self.assertEqual(response.status_code,308)
        self.assertEqual(response.headers['Location'],'https://demo.example.com/')
        proxy=self.make_app(TRUST_PROXY=True).test_client()
        self.assertEqual(proxy.get('/login',base_url='http://demo.example.com',headers={'X-Forwarded-Proto':'https'}).status_code,200)

    def test_health_check_hosts_and_headers(self):
        client=self.make_app().test_client()
        health=client.get('/api/health',base_url='http://10.0.0.2')
        self.assertEqual(health.status_code,200)
        self.assertEqual(health.json,{'status':'ok'})
        self.assertEqual(client.get('/',base_url='https://evil.example.com').status_code,400)
        response=client.get('/login',base_url='https://demo.example.com')
        self.assertIn("frame-ancestors 'none'",response.headers['Content-Security-Policy'])
        self.assertEqual(response.headers['X-Content-Type-Options'],'nosniff')
        self.assertEqual(response.headers['Referrer-Policy'],'strict-origin-when-cross-origin')
        self.assertIn('max-age=',response.headers['Strict-Transport-Security'])

    def test_production_cors_not_wildcard_or_preview_and_limits_concurrency(self):
        app=self.make_app();client=app.test_client();token,_=self.login(client)
        self.assertEqual(client.options('/api/profile',base_url='https://demo.example.com',headers={'Origin':'http://localhost:5500'}).status_code,403)
        semaphore=app.extensions['limits'].inflight
        semaphore.acquire();semaphore.acquire()
        try:
            with patch('server.call_gemini') as upstream:
                response=client.post('/api/profile',json={'note':'Jamie'},headers={'X-CSRF-Token':token},base_url='https://demo.example.com')
                self.assertEqual(response.status_code,429);upstream.assert_not_called()
        finally:
            semaphore.release();semaphore.release()

    def test_unexpected_errors_are_not_exposed(self):
        client=self.make_app().test_client();token,_=self.login(client)
        with self.assertLogs('webapp',level='ERROR'), patch('server.call_gemini',side_effect=OSError('private-test-secret')):
            response=client.post('/api/profile',json={'note':'Jamie'},headers={'X-CSRF-Token':token},base_url='https://demo.example.com')
            self.assertEqual(response.status_code,500)
            self.assertNotIn('private-test-secret',response.get_data(as_text=True))

    def test_missing_api_key_and_forged_session(self):
        with patch.dict(os.environ, {'GEMINI_API_KEY':''}):
            with self.assertRaises(RuntimeError):
                self.make_app()
        client=self.make_app().test_client()
        client.set_cookie('rolodexi_session','forged-session',domain='demo.example.com')
        self.assertEqual(client.get('/api/session',base_url='https://demo.example.com').status_code,401)


if __name__=='__main__':
    unittest.main()
