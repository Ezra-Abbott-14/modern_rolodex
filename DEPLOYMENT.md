# Secured hosting and AWS handoff

## Current status and scope

The application has a Python backend. It now runs Flask through Waitress, with a
production access-code gate, signed HttpOnly sessions, CSRF protection, request-size
limits, per-session/global request limits, and a two-request Gemini concurrency cap.
The Gemini key is loaded only by Python; it is never embedded in browser files.

**This repository is not itself a running public service.** The team is preparing
AWS infrastructure. Provisioning a public host/domain and testing actual remote
devices are pending that work, at the team's request. Nothing here opens a Windows
firewall port or publishes the developer's laptop.

AWS RDS hosts the team's MySQL database. It does not execute Python or serve the
website. The AWS teammate must also provide compute (for example an EC2 instance,
an ECS service, or an Elastic Beanstalk application), an HTTPS endpoint, and secrets.
This change does not add an RDS connection or migrate profiles. Cards remain in each
browser's localStorage, so sharing the website does not share everyone's contacts.

## Quick handoff checklist for the AWS teammate

1. Deploy this repository as one Python service/container, with one process and one
   replica. Use `Dockerfile`, or install `requirements.txt` and run `python server.py`.
2. Put an HTTPS load balancer/reverse proxy in front of the service. The backend's
   plain HTTP port is private and reachable only from that proxy/security group.
3. Configure the required production environment variables below using server-side
   secrets, not JavaScript, a public GitHub file, or a Docker build argument.
4. Set the health-check path to `/api/health`, on the private backend port. It returns
   HTTP 200 with `{"status":"ok"}` and no key/configuration detail in production.
5. Set `TRUST_PROXY=1` only when the trusted proxy overwrites `X-Forwarded-Proto`
   and the service cannot be reached directly by internet visitors.
6. Share the public HTTPS URL and the separate demo access code with the team/judges.
   Visitors need neither Python nor Gemini keys on their own machines.
7. Run the external-device acceptance checklist at the end before the presentation.

## Production configuration

| Variable | Required value / behavior |
| --- | --- |
| `APP_ENV` | `production`. Enables HTTPS requirements, Secure cookies, authentication checks, and startup validation. |
| `HOST` | `0.0.0.0` inside a private container/host so the proxy can reach it. Never expose its HTTP port publicly. |
| `PORT` | Backend port, normally `8000`; must match the container target/proxy configuration. |
| `PUBLIC_ORIGIN` | Exact public HTTPS origin, e.g. `https://rolodex.example.org`. No path, credentials, query, or fragment. |
| `GEMINI_API_KEY` | Existing Gemini credential, injected as a server-side secret. Required at startup in production. |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite`, which passed the existing live extraction tests. |
| `DEMO_ACCESS_CODE` | A separate random shared demo password, at least 12 characters; recommend 24+ random characters. Do not reuse the Gemini key. |
| `SESSION_SECRET` | Independent random secret, at least 32 characters; recommend 64+ random characters. Keep stable across normal starts; rotating it invalidates signed cookies. |
| `TRUST_PROXY` | `1` behind the private HTTPS proxy described above; otherwise leave `0`. |

Production refuses to start if the origin is not HTTPS or the key/access-code/session
secret is missing or too short, or if those secrets reuse the same value.
Development refuses non-loopback access. This is
deliberate: changing only `HOST=0.0.0.0` must not silently publish an unprotected API.

To generate a random secret on a trusted machine, run:

```sh
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Run it separately for the access code and the session secret. Copy the values
directly into the private hosting secret settings; do not paste them into chat or
screenshots. The access code may be shared privately with authorized demo visitors;
the Gemini key and session secret must stay with the backend operator.

## AWS secrets and networking

Use AWS Secrets Manager (or the team's approved secret store) for `GEMINI_API_KEY`,
`DEMO_ACCESS_CODE`, and `SESSION_SECRET`. Have the deployment platform inject the
secret values as environment variables. The current app does not call AWS Secrets
Manager itself and does not need AWS credentials in the browser.

Grant only the service's execution/instance role access to the required secrets.
Do not give the website frontend permission to read them. Do not bake `.env` into
an image. `.dockerignore` excludes it, and the Dockerfile copies only named files.

Use a certificate at the public proxy/load balancer. Redirect public HTTP to HTTPS.
Allow the private Python port from the load balancer's security group only. The
app validates the application hostname and does not trust forwarded host/IP headers.
Only forwarded protocol is trusted when explicitly enabled. A misconfigured public
backend port would undermine that trust boundary; do not publish port 8000 directly.

When the separate RDS integration is added, keep database credentials server-side,
keep RDS private, and allow the database port only from the application security
group. There is no reason to grant judges' browsers direct database access.

Official references: [Flask deployment with Waitress](https://flask.palletsprojects.com/en/stable/deploying/waitress/),
[Flask security settings](https://flask.palletsprojects.com/en/stable/web-security/),
[Waitress proxy trust](https://docs.pylonsproject.org/projects/waitress/en/stable/arguments.html),
[AWS ECS secret injection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html).

## Start commands and containers

For a Python environment on Linux:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
# Set production environment variables in the hosting secret/configuration system.
python server.py
```

For a container:

```sh
docker build -t rolodexi .
# The hosting service supplies the production environment and private port routing.
```

The container runs as a non-root user, listens on its configured internal port, and
has a private HTTP health check. It contains no .env, Git history, tests, or recordings.
The `Procfile` also supplies `web: python server.py` for platforms that use it.
No Docker build or AWS deployment should be reported as verified until run in an
environment with Docker/AWS access. Docker is not installed on the current workspace.

## Local development and testing

Local development remains loopback-only and does not require the demo access code.
Keep the existing local `.env` with the Gemini key; never overwrite it with the example.
On Windows, install dependencies once with `./setup.ps1`, then run `./start.ps1`.
The launcher prefers the project's ignored `.venv` Python. On another machine, install
Python 3.10+ first. On Linux/macOS use the virtualenv commands above in development mode.

Optional local login test: set `DEMO_ACCESS_CODE` and `SESSION_SECRET` in your terminal
while keeping `APP_ENV=development` and `HOST=127.0.0.1`. Open the Python-served URL,
not Live Server. Local HTTP cookies are intentionally not Secure in this test mode;
this is not a substitute for the production HTTPS acceptance test.

Tests:

```sh
python -m unittest discover -v -p 'test_*.py'
node --test test_profile_api.mjs
```

Tests cover missing/invalid production configuration, unauthorized extraction,
login and extraction CSRF, Secure/HttpOnly/SameSite cookies, rate limits, concurrency,
logout/replayed-session rejection, forged cookies, origin/host validation, HTTPS
redirects, proxy-header behavior, body/type limits, and secret-file exclusion.
Mocked Gemini tests do not prove that the deployed key/quota/network works.

## Sessions, limits, and operational boundaries

- Shared demo access code, not individual user accounts or a complete identity system.
- Sessions expire after four hours. Signing out revokes that session on this instance;
  restarting the instance also invalidates its in-memory sessions. The Sign out button
  does not erase localStorage contacts. Use separate browser profiles on shared computers.
- Five login attempts per source IP/minute, 30 login attempts globally/minute.
- Ten profile attempts per session/minute, 60 globally/minute, at most two concurrent
  Gemini calls. Invalid/failed requests can consume limits to discourage retries/abuse.
- 64 KB body limit; notes remain limited to 8,000 characters; Gemini output is bounded.
- Session/rate state is in memory: **one process and one replica only**. Before scaling
  horizontally, use a shared session/rate-limit store such as Redis and revisit proxy/IP handling.
- Behind a proxy, source-IP login limits may apply to the whole proxy. Per-session
  profile limits remain distinct. No untrusted X-Forwarded-For is accepted.
- The code protects the Gemini credential; it does not guarantee unlimited capacity,
  zero model mistakes, shared contact storage, or protection from a large DDoS.
- Monitor Gemini usage and hosting metrics. Set provider spending/quota controls and
  restrict access-code distribution. Do not log raw profile notes or credentials.

## External-device acceptance checklist (pending AWS)

1. Open the shared HTTPS URL from a second device with no repository, .env, or API key.
2. Confirm the access-code page appears, and an incorrect code is rejected.
3. Sign in with the privately shared demo code; verify the nine example cards appear.
4. Enter a fictional note, extract with live Gemini, review, save, search, and reload.
5. Inspect browser network responses: no Gemini key, session secret, or access code in
   app.js/index.html/profile responses; session cookie is Secure and HttpOnly.
6. Confirm plain HTTP redirects to HTTPS; direct public access to backend port 8000 is blocked.
7. Sign out; extraction must require sign-in. A private/incognito window must also sign in.
8. Verify RDS remains private; no database/key setup should be required on the device.

Pending owner: the AWS teammate must supply the compute/service choice and final
HTTPS origin. They asked us to defer provisioning while they prepare it. Record
those answers and the actual external-device result in DEVELOPMENT_LOG.md.
