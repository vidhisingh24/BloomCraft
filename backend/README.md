# BloomCraft backend

FastAPI + SQLAlchemy 2.0 (asyncpg) + PostgreSQL 18, native on Windows. All commands run from
the repository root.

## Local services

PostgreSQL 18 runs as the Windows service `postgresql-x64-18` (automatic start):

```powershell
pg_isready -h 127.0.0.1 -p 5432
```

Mailpit (SMTP `127.0.0.1:1025`, web UI http://127.0.0.1:8025) is started by `dev.ps1` when it
is not already running, or by hand:

```powershell
Start-Process mailpit -ArgumentList '--smtp','127.0.0.1:1025','--listen','127.0.0.1:8025' -WindowStyle Hidden
```

## Secrets and configuration

- Key and password files live in `backend/secrets/` (gitignored, ACL restricted to the current user).
- `backend/.env` (gitignored) holds the database URLs; `backend/.env.example` lists every variable.
- Paths inside `.env` are repo-root-relative (`backend/...`) and resolve independently of the
  working directory.

## First run (the owner, once, on the dev database)

```powershell
uv run --project backend alembic -c backend/alembic.ini upgrade head
uv run --project backend bloomcraft create-admin --email <your email> --name "<your name>"
uv run --project backend bloomcraft create-seller --email <same email> --name "<your name>" --shop-name "BloomCraft"
uv run --project backend bloomcraft seed --all
uv run --project backend bloomcraft doctor
```

- `create-admin` asks for a password in a hidden prompt (twice) and checks it against the
  password policy (15-128 characters, no common or guessable passwords, nothing built from your
  email, name or shop name). The admin must enrol TOTP at the first sign-in.
- `create-seller` with the same email adds the approved seller grant and shop profile to the
  admin account (no second password). Then set `FOUNDING_SELLER_EMAIL` in `backend/.env` to that
  email. With exactly one seller, `seed --settings` / `create-seller` make it the default seller
  for custom requests.
- `seed --all` inserts the categories, store settings and coupons from `backend/seeds/*.json`.
  Re-running inserts only what is missing and lists rows that differ from the files;
  `--update` makes those rows match the files again (never touching a coupon's redemption
  count or the default custom-request seller).
- Try any of these on the test database first: put `--db test` before the command, e.g.
  `uv run --project backend bloomcraft --db test seed --all`. Scripts can pass the password
  with `--password-stdin` (one line on stdin).
- Admin recovery: `create-admin` refuses while an active admin exists (later admins come through
  invitations). Once no active admin is left it works again and re-activates the admin grant of
  an existing account without touching its password.

## Run the API and the worker

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/scripts/dev.ps1
```

Starts Mailpit if needed, the worker (`python -m app.workers`) in the background and the API
with reload on http://127.0.0.1:8000 (docs at `/docs` in development). Ctrl+C stops both.

Individually:

```powershell
uv run --project backend uvicorn app.main:app --port 8000 --no-server-header --no-proxy-headers --no-access-log
uv run --project backend python -m app.workers
```

Health: `GET /health/live` (process up) and `GET /health/ready` (database reachable as the app
role and migrations at head; `503` problem+json otherwise).

## Checks

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/scripts/check.ps1
```

Runs ruff, ruff format, mypy --strict, pytest with coverage (+ per-package floors), pip-audit,
gitleaks and the OpenAPI snapshot check; stops at the first failure.

Tests alone: `uv run --project backend pytest backend/tests -q` (needs PostgreSQL; the test
session migrates `bloomcraft_test` up, down and up again).

## Migrations (both databases, always as `bloomcraft_migrator`)

```powershell
uv run --project backend alembic -c backend/alembic.ini upgrade head               # bloomcraft
uv run --project backend alembic -c backend/alembic.ini -x db=test upgrade head    # bloomcraft_test
uv run --project backend alembic -c backend/alembic.ini -x db=test check           # model/migration drift
```

Revisions are hand-written (autogenerate only as a draft); each one creates its tables' grants,
triggers and RLS policies. Never edit an applied revision. Data protection rules:
`backend/docs/adr/0001-data-protection.md`.

## Rotate field-encryption keys

1. Add the new key to `backend/secrets/field_keyring.json` and set `"active"` to its id (keep the
   old key); restart the API and worker.
2. `uv run --project backend bloomcraft rotate-field-keys --to <new key id>` (optional
   `--batch-size 500`); run it again until it reports 0 re-encrypted.
3. Remove the old key from the keyring.

## Doctor, OpenAPI

```powershell
uv run --project backend bloomcraft doctor                 # settings, keys, DB, actor context, migrations, SMTP, dirs
uv run --project backend bloomcraft openapi --write        # refresh backend/docs/openapi.json
```
