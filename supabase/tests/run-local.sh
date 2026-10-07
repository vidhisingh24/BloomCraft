#!/usr/bin/env bash
# Runs the database security tests against a throwaway local PostgreSQL (15+) cluster.
# Needs initdb, pg_ctl and psql on PATH (or PG_BIN=/path/to/postgres/bin). Touches nothing else.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
BIN="${PG_BIN:+$PG_BIN/}"
PORT="${PG_TEST_PORT:-55432}"
DATA="$(mktemp -d)/pgdata"

cleanup() { "${BIN}pg_ctl" -D "$DATA" stop -m fast >/dev/null 2>&1 || true; rm -rf "$(dirname "$DATA")"; }
trap cleanup EXIT

"${BIN}initdb" -D "$DATA" -U postgres -A trust -E UTF8 --locale=C >/dev/null
"${BIN}pg_ctl" -D "$DATA" -o "-p $PORT -c listen_addresses=localhost" -l "$DATA/log" start -w >/dev/null

psql_run() { "${BIN}psql" -h localhost -p "$PORT" -U postgres -d bloomcraft_test -v ON_ERROR_STOP=1 -q "$@"; }
"${BIN}psql" -h localhost -p "$PORT" -U postgres -q -c "create database bloomcraft_test"

psql_run -f "$HERE/supabase_stubs.sql" 2>&1 | grep -v -e wal_level -e HINT || true
for migration in "$ROOT"/migrations/*.sql; do psql_run -f "$migration"; done
psql_run -f "$ROOT/seed.sql"
psql_run -f "$ROOT/past_orders.sql" >/dev/null
psql_run -f "$HERE/security_test.sql" 2>&1 | grep -E "ok - |ERROR|FAILED|passed" | sed "s/^.*NOTICE:  //"
exit "${PIPESTATUS[0]}"
