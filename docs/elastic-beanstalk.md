# Elastic Beanstalk deployment checklist

This is the first deployment path for the Python backend. It is intentionally a
single-instance hackathon deployment, not a production architecture.

## Bundle

The repository root contains:

- `Procfile`: starts `server.py`;
- `requirements.txt`: installs the MySQL connector;
- `server.py`: reads `PORT` and binds to `0.0.0.0` for the hosted proxy.
- `database/repository.py`: the runtime persistence module imported by `server.py`.

Do not upload `.env` or any credentials. The `.ebignore` file excludes local secrets,
tests, and documentation from the deployment bundle.

## AWS console settings

Create an Elastic Beanstalk application named `rolodexi` in `us-west-2`, then create a
web-server environment named `rolodexi-dev` with the latest supported Python 3.x
platform. Use the smallest single-instance option and the default VPC. Do not attach a
new database through the Beanstalk wizard; use the existing RDS instance.

Set these environment properties in Beanstalk. Values containing secrets must be
entered privately, never committed or sent in chat:

```text
DB_HOST=rolodexi-dev.c4rjdref5zcz.us-west-2.rds.amazonaws.com
DB_PORT=3306
DB_NAME=rolodexi
DB_USER=rolodexi_app
DB_PASSWORD=<private>
GEMINI_API_KEY=<private>
GEMINI_MODEL=gemini-3.1-flash-lite
```

## RDS security group

After Beanstalk creates its instance security group, add that security group as the
source of an inbound MySQL/Aurora TCP 3306 rule on `rolodexi-dev-db`. Do not use a
public IP rule for the deployed backend and never use `0.0.0.0/0`.

## Verification

The first hosted check is:

```text
GET https://<beanstalk-host>/api/health
```

The health response returns HTTP 200 only when the process has the configured database
settings and can execute `SELECT 1`; it reports Gemini configuration separately. It does
not prove that the schema exists or that contact CRUD works. Those require the database
smoke test and the hosted create/read/update check.
