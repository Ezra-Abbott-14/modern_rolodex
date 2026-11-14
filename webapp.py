"""Deployment application: Flask routing/security, served by Waitress (not Flask debug)."""
import hashlib
import hmac
import os
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

from flask import Flask, jsonify, redirect, render_template, request, send_from_directory, session, Response
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
import server

ASSETS = {'index.html', 'styles.css', 'app.js', 'profile-api.mjs',
          'street_valley_world.js', 'street_valley_characters.js', 'roladexi.jpg'}
PREVIEWS = {'http://localhost:5500', 'http://127.0.0.1:5500'}


class Limits:
    """Single-process, thread-safe limits. No note, key, or password storage."""
    def __init__(self):
        self.lock = threading.Lock()
        self.buckets = defaultdict(deque)
        self.inflight = threading.BoundedSemaphore(2)
        self.sessions = {}

    def register(self, identity):
        with self.lock:
            now = time.monotonic()
            self.sessions = {key:expiry for key,expiry in self.sessions.items() if expiry > now}
            if len(self.sessions) >= 1024:
                return False
            self.sessions[identity] = now + 4 * 3600
            return True

    def active(self, identity):
        with self.lock:
            return self.sessions.get(identity, 0) > time.monotonic()

    def revoke(self, identity):
        with self.lock:
            self.sessions.pop(identity, None)

    def allow(self, key, count, window=60):
        now = time.monotonic()
        with self.lock:
            if key not in self.buckets and len(self.buckets) >= 1024:
                for old in list(self.buckets):
                    if not self.buckets[old] or now - self.buckets[old][-1] >= window:
                        del self.buckets[old]
                if len(self.buckets) >= 1024:
                    return False
            bucket = self.buckets[key]
            while bucket and now - bucket[0] >= window:
                bucket.popleft()
            if len(bucket) >= count:
                return False
            bucket.append(now)
            return True


def create_app(overrides=None):
    server.load_env()
    app = Flask(__name__, static_folder=None)
    production = os.environ.get('APP_ENV', 'development') == 'production'
    app.config.update(
        DEBUG=False,
        PRODUCTION=production,
        PUBLIC_ORIGIN=os.environ.get('PUBLIC_ORIGIN', '').rstrip('/'),
        DEMO_ACCESS_CODE=os.environ.get('DEMO_ACCESS_CODE', ''),
        SECRET_KEY=os.environ.get('SESSION_SECRET') or (None if production else secrets.token_hex(32)),
        TRUST_PROXY=os.environ.get('TRUST_PROXY', '0') == '1',
        MAX_CONTENT_LENGTH=64000, MAX_FORM_MEMORY_SIZE=8192,
        SESSION_COOKIE_NAME='rolodexi_session', SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Strict', SESSION_COOKIE_SECURE=production,
        PERMANENT_SESSION_LIFETIME=timedelta(hours=4), SESSION_REFRESH_EACH_REQUEST=False,
        API_RATE_LIMIT=10, GLOBAL_RATE_LIMIT=60,
    )
    if overrides:
        app.config.update(overrides)
    production = app.config['PRODUCTION']
    origin = urlsplit(app.config['PUBLIC_ORIGIN'])
    if production:
        if origin.scheme != 'https' or not origin.hostname or origin.username or origin.password or origin.path or origin.query or origin.fragment:
            raise RuntimeError('Production requires PUBLIC_ORIGIN as an HTTPS origin without a path.')
        if len(app.config['DEMO_ACCESS_CODE']) < 12 or len(app.config['SECRET_KEY'] or '') < 32:
            raise RuntimeError('Production requires DEMO_ACCESS_CODE (12+ characters) and SESSION_SECRET (32+ characters).')
        if not os.environ.get('GEMINI_API_KEY', '').strip():
            raise RuntimeError('Production requires GEMINI_API_KEY in server-side secret configuration.')
        if len({app.config['DEMO_ACCESS_CODE'], app.config['SECRET_KEY'], os.environ['GEMINI_API_KEY']}) != 3:
            raise RuntimeError('Use different values for the demo code, session secret, and Gemini key.')
        app.config['SESSION_COOKIE_SECURE'] = True
    if app.config['TRUST_PROXY']:
        # Enable only behind a private AWS load balancer that overwrites this header.
        # Do NOT trust X-Forwarded-Host or X-Forwarded-For supplied by visitors.
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=0, x_host=0, x_proto=1, x_port=0, x_prefix=0)
    limits = app.extensions['limits'] = Limits()
    auth = bool(app.config['DEMO_ACCESS_CODE'])

    def fail(message, status, code=None):
        payload = {'error': message}
        if code:
            payload['code'] = code
        response = jsonify(payload)
        response.status_code = status
        if status == 429:
            response.headers['Retry-After'] = '60'
        return response

    def csrf():
        if 'csrf' not in session:
            session['csrf'] = secrets.token_urlsafe(32)
        return session['csrf']

    def origin_allowed():
        value = request.headers.get('Origin')
        if value is None:
            return True
        local_port = urlsplit(request.host_url).port or 80
        local_origins = {f'http://localhost:{local_port}', f'http://127.0.0.1:{local_port}'}
        return value == request.host_url.rstrip('/') or (production and value == app.config['PUBLIC_ORIGIN']) or (not production and value in local_origins) or (not production and not auth and value in PREVIEWS)

    @app.before_request
    def protect():
        # ALB/container health checks can use a private-IP Host header. Only the
        # read-only health response is exempt from application-host validation.
        try:
            hostname = urlsplit('http://' + request.host).hostname
        except ValueError:
            hostname = None
        permitted_hosts = {origin.hostname, 'localhost', '127.0.0.1'} if production else {'localhost', '127.0.0.1'}
        if request.path != '/api/health' and hostname not in permitted_hosts:
            return fail('Unrecognized application host.', 400)
        if not production and request.remote_addr not in ('127.0.0.1', '::1', None):
            return fail('Development mode is available on this computer only.', 403)
        if production and request.path != '/api/health' and not request.is_secure:
            return redirect(app.config['PUBLIC_ORIGIN'] + request.path, code=308)
        if request.method in ('POST', 'PATCH', 'OPTIONS') and not origin_allowed():
            return fail('This website cannot use the profile service.', 403)
        if request.path in ('/api/health', '/login') or request.method == 'OPTIONS':
            return None
        if auth and not (session.get('authenticated') and limits.active(session.get('identity'))):
            if request.path.startswith('/api/'):
                return fail('Your demo session has expired. Sign in again to extract profiles.', 401, 'AUTH_REQUIRED')
            # Login styling is public, but the app/assets are gated.
            if request.path != '/styles.css':
                return redirect('/login')
        if request.method in ('POST', 'PATCH') and auth:
            supplied = request.headers.get('X-CSRF-Token', '')
            if not supplied or not hmac.compare_digest(supplied, session.get('csrf', '')):
                return fail('Refresh the page and retry this request.', 403, 'CSRF_FAILED')

    @app.after_request
    def headers(response):
        response.headers.update({
            'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY',
            'Referrer-Policy':'strict-origin-when-cross-origin', 'Cache-Control':'no-store',
            'Permissions-Policy':'camera=(), geolocation=(), microphone=(self)',
            'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        })
        if production:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000'
        if not production and not auth and request.headers.get('Origin') in PREVIEWS:
            response.headers['Access-Control-Allow-Origin'] = request.headers['Origin']
            response.headers['Vary'] = 'Origin, Cookie'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRF-Token'
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        return fail({400:'Invalid JSON or request.', 404:'Not found.', 413:'Note is too large (maximum 8,000 characters).', 415:'Send a JSON request.'}.get(error.code, 'Request could not be processed.'), error.code)

    @app.errorhandler(Exception)
    def unexpected(error):
        app.logger.error('Unexpected request failure: %s', type(error).__name__)
        return fail('The service encountered an error. Please retry.', 500)

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if not auth:
            return redirect('/')
        error = None
        status = 200
        if request.method == 'POST':
            if not limits.allow('login-global', 30) or not limits.allow('login-' + str(request.remote_addr), 5):
                return fail('Too many sign-in attempts. Wait a minute and try again.', 429)
            supplied_csrf = request.form.get('csrf', '')
            if not supplied_csrf or not hmac.compare_digest(supplied_csrf, session.get('csrf', '')):
                return fail('Refresh the sign-in page and retry.', 403)
            supplied = hashlib.sha256(request.form.get('access_code', '').encode()).digest()
            expected = hashlib.sha256(app.config['DEMO_ACCESS_CODE'].encode()).digest()
            if hmac.compare_digest(supplied, expected):
                limits.revoke(session.get('identity'))
                identity = secrets.token_urlsafe(24)
                if not limits.register(identity):
                    return fail('The demo is at capacity. Please try later.', 429)
                session.clear()
                session.update(authenticated=True, identity=identity, csrf=secrets.token_urlsafe(32))
                session.permanent = True
                return redirect('/')
            error, status = 'That access code was not recognized.', 401
        return render_template('login.html', csrf=csrf(), error=error), status

    @app.post('/logout')
    def logout():
        limits.revoke(session.get('identity'))
        session.clear()
        return jsonify({'ok': True})

    @app.get('/api/health')
    def health():
        return jsonify({'status':'ok'} if production else {'status':'ok', 'configured':bool(os.environ.get('GEMINI_API_KEY', '').strip())})

    def owner_id():
        # Temporary MVP owner until the auth service supplies a stable user id.
        return server.DEV_OWNER_ID

    def repository():
        if not server.database_configured():
            raise RuntimeError('Database is not configured.')
        return server.get_repository()

    @app.get('/api/contacts')
    def contacts():
        try:
            return jsonify({'contacts': server.json_safe(repository().list_contacts(owner_id()))})
        except Exception:
            app.logger.error('Contact list failed')
            return fail('Database is temporarily unavailable.', 503, 'DATABASE_UNAVAILABLE')

    @app.get('/api/contacts/<contact_id>')
    def contact(contact_id):
        try:
            value = repository().get_contact(owner_id(), contact_id)
            if value is None:
                return fail('Contact not found.', 404, 'CONTACT_NOT_FOUND')
            return jsonify({'contact': server.json_safe(value)})
        except Exception:
            app.logger.error('Contact lookup failed')
            return fail('Database is temporarily unavailable.', 503, 'DATABASE_UNAVAILABLE')

    @app.post('/api/contacts')
    def create_contact():
        try:
            body = request.get_json(silent=True)
            profile, source_text = server.validate_contact_body(body)
            value = repository().create_contact(
                owner_id(), profile, source_text=source_text,
                provider='gemini' if source_text else None,
                model=os.environ.get('GEMINI_MODEL') if source_text else None,
                source_expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=30) if source_text else None,
            )
            return jsonify({'contact': server.json_safe(value)}), 201
        except ValueError as error:
            return fail(str(error), 400, 'INVALID_CONTACT')
        except Exception:
            app.logger.error('Contact create failed')
            return fail('Database is temporarily unavailable.', 503, 'DATABASE_UNAVAILABLE')

    @app.patch('/api/contacts/<contact_id>')
    def update_contact(contact_id):
        try:
            body = request.get_json(silent=True)
            changes, _ = server.validate_contact_body(body, partial=True)
            repository().update_contact(owner_id(), contact_id, changes,
                                        events=body.get('events') if 'events' in body else None,
                                        tags=body.get('tags') if 'tags' in body else None)
            value = repository().get_contact(owner_id(), contact_id)
            if value is None:
                return fail('Contact not found.', 404, 'CONTACT_NOT_FOUND')
            return jsonify({'contact': server.json_safe(value)})
        except ValueError as error:
            return fail(str(error), 400, 'INVALID_CONTACT')
        except Exception:
            app.logger.error('Contact update failed')
            return fail('Database is temporarily unavailable.', 503, 'DATABASE_UNAVAILABLE')

    @app.get('/api/session')
    def session_info():
        return jsonify({'auth_required':auth, 'csrf_token':csrf() if auth else None})

    @app.route('/api/profile', methods=['POST', 'OPTIONS'])
    def profile():
        if request.method == 'OPTIONS':
            return '', 204
        if not request.is_json:
            return fail('Send a JSON request.', 415)
        body = request.get_json()
        note = body.get('note') if isinstance(body, dict) else None
        if not isinstance(note, str) or not note.strip() or len(note) > 8000:
            return fail('Enter a note of 1–8,000 characters about a person.', 400)
        identity = session.get('identity') or request.remote_addr or 'local'
        if not limits.allow('api-' + identity, app.config['API_RATE_LIMIT']) or not limits.allow('api-global', app.config['GLOBAL_RATE_LIMIT']):
            return fail('Too many profile requests. Wait a minute, then try again.', 429)
        if not limits.inflight.acquire(blocking=False):
            return fail('The profile service is busy. Please retry shortly.', 429)
        try:
            return jsonify({'profile':server.call_gemini(note.strip())})
        except ValueError as error:
            return fail(str(error), 422)
        except RuntimeError as error:
            return fail(str(error), 503)
        finally:
            limits.inflight.release()

    @app.get('/')
    @app.get('/<path:filename>')
    def assets(filename='index.html'):
        if filename not in ASSETS:
            return fail('Not found.', 404)
        if filename == 'index.html' and auth:
            markup = (server.ROOT / filename).read_text(encoding='utf-8')
            markup = markup.replace('</head>', f'<meta name="csrf-token" content="{csrf()}"></head>')
            return Response(markup, content_type='text/html; charset=utf-8')
        return send_from_directory(server.ROOT, filename)

    return app
