# Database harness

`db_harness.py` is the database-only connectivity and smoke-test tool. It reads
the repository-root `.env` without printing secret values. It has no database
side effects when imported.

## Required `.env` settings

```dotenv
DB_HOST=rolodexi-dev....rds.amazonaws.com
DB_PORT=3306
DB_NAME=rolodexi
DB_ADMIN_USER=rolodexi_admin
DB_ADMIN_PASSWORD=...
```

The non-admin settings are used by future application code. The harness uses
the admin settings for `check` and for its disposable-schema smoke test because
those commands create/drop a temporary database. Do not commit `.env` or put
passwords in chat.

## Commands

Run from the repository root with the team's Python executable:

```powershell
python database\db_harness.py check
python database\db_harness.py smoke
```

`check` verifies the RDS endpoint, MySQL server version, selected database, and
authenticated account. It does not prove that the application backend uses the
database, that the security group is safe, or that the application user has
the intended grants.

After connectivity works, apply the initial schema explicitly with the admin
credentials:

```powershell
python database\db_harness.py migrate
```

This runs `001_initial_schema.sql` against `DB_NAME`; it is not run automatically
when the web server starts. It is suitable for the clean MVP database because the
statements are `CREATE TABLE IF NOT EXISTS`. Future structural changes must use a
numbered migration and be reviewed before applying them to an existing database.

User creation is deliberately explicit and requires these additional private
settings:

```dotenv
DB_APP_USER=rolodexi_app
DB_APP_PASSWORD=...
DB_TEST_USER=rolodexi_test
DB_TEST_PASSWORD=...
DB_TEST_NAME=rolodexi_test
```

Then run:

```powershell
python database\db_harness.py create-users
```

This creates or refreshes the application and test accounts. The application
account receives only `SELECT, INSERT, UPDATE, DELETE` on `DB_NAME`. The test
account receives `ALL` only on `DB_TEST_NAME`. It never runs automatically.

`smoke` creates a random `rolodexi_smoke_<suffix>` schema, applies
`001_initial_schema.sql`, checks all five tables, ownership columns, foreign
keys, nullable fields, and UTF-8 values, then drops only that generated schema
in cleanup. It does not prove API behavior, authentication, owner filtering in
application queries, backup deletion, provider retention, S3 behavior, or
production readiness.

## Runtime and network limitations

The harness requires `mysql-connector-python` and network access to RDS. A
successful local Workbench connection does not guarantee that another runtime
can reach the endpoint; AWS security-group rules and the execution environment
both matter. If the runtime cannot reach RDS, the command reports the concrete
connector error without exposing a password.
