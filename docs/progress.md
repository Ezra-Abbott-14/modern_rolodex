# Database workstream progress

Last updated: 2026-11-14

## Current target

Deploy a single-owner MVP using AWS RDS MySQL and a Python backend. Authentication,
multiple accounts, audio storage, automatic source deletion, and cloud object storage
are future work unless explicitly promoted.

## Done

- Moved the repository out of OneDrive to `C:\GitHub\modern_rolodex`.
- Created branch `database-hannah`.
- Added the initial MySQL schema and read-only schema verification script.
- Added the database-facing JSON contract.
- Added the database connectivity/disposable-schema harness.
- Provisioned an RDS MySQL 8.4 instance in `us-west-2`.
- Installed MySQL Connector/Python in the available Python 3.14 runtime.
- Prepared an initial Elastic Beanstalk deployment slice: `Procfile`, `requirements.txt`, `.ebignore`, and hosted bind configuration.
- Added the owner-scoped repository with transactional contact/source/memory/tag writes.
- Added database-backed contact list/detail/create/update routes and a database-aware health route.
- Replaced the browser card persistence path with the database API; the UI now starts from the clean database and sends creates/updates to the backend.
- Added repository and API tests covering owner scoping, duplicate-safe creation, empty-list clearing, invalid input, and repeated profile extraction.

## Not done

- The schema has not been applied to RDS, because port 3306 is not reachable from the current network.
- `server.py` and `app.js` are connected through the documented contact API; browser localStorage cards are intentionally not imported.
- The current public deployment mode uses one fixed development owner and is not private; authentication is still a high-priority stretch goal.
- Limited application/test MySQL users have not been created.
- Elastic Beanstalk environment has not been created.
- No public hosted end-to-end flow has been verified.

## Current blockers

- Direct TCP access to RDS fails from both the Codex runner and the user's computer;
  the likely cause is network/firewall configuration, but it is not yet proven.
- Python is visible to Codex only through elevated execution because the normal sandbox
  cannot access the user's local Python installation.

## Next implementation sequence

1. Replace the JS save/load path with the agreed JSON API calls.
2. Run unit, mocked integration, and local end-to-end tests.
3. Create the Beanstalk environment and configure private environment variables.
4. Apply the schema from inside the hosted environment or another permitted network path.
5. Allow the Beanstalk security group to reach RDS on port 3306.
6. Run the hosted create/read/update flow and record evidence.

## Agent coordination rule

Use one active implementation agent per write boundary, followed by one independent
review agent. Record changed files, tests, blockers, and commit status here after each
completed work step. Do not assume a subagent changed files until the main workspace is
inspected.
