# Database harness verification

The database workstream owns `database/db_harness.py`. It is intentionally
separate from `server.py`, the browser, API routes, and deployment files.

The harness has three explicit operations:

- `check`: read-only identity/connectivity check.
- `create-users`: explicit bootstrap of least-privilege app/test accounts.
- `smoke`: disposable-schema migration and invariant test with cleanup.

Read [database/README.md](../database/README.md) for the exact environment
variables and commands. The `.env` file is local secret configuration; only
`.env.example` belongs in Git.

The smoke test is evidence about the migration and MySQL behavior. It is not
evidence that authentication, REST routes, AI processing, owner authorization,
AWS backups, S3, or production deployment work. Those require separate tests
owned by the relevant workstream.
