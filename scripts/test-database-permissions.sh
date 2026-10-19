#!/usr/bin/env bash
set -euo pipefail
: "${TEST_DATABASE_URL:?Use a disposable empty database for TEST_DATABASE_URL}"
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/security/bootstrap.sql
for migration in supabase/migrations/*.sql; do
  # Local PostgreSQL lacks Supabase's scheduler/network extensions. These two
  # migrations do not change application permissions or functions under test.
  case "$migration" in *20260301014649*|*20260303171203*) continue;; esac
  psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/security/company-permissions.sql
