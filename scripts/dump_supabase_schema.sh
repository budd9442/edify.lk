#!/usr/bin/env bash
set -euo pipefail

#
# Dump Supabase database schema (tables, functions, triggers, RLS policies)
# into a timestamped .sql file that can be pasted into the Supabase SQL console
# to recreate the structure in another project.
#
# Usage:
#   SUPABASE_DB_URL="postgresql://USER:PASSWORD@HOST:PORT/DB" ./scripts/dump_supabase_schema.sh
#   or:
#   ./scripts/dump_supabase_schema.sh "postgresql://USER:PASSWORD@HOST:PORT/DB"
#
# You can find the connection string in:
#   Supabase Dashboard → Project Settings → Database → Connection strings → psql
#

DB_URL="${SUPABASE_DB_URL:-${1:-}}"

if [[ -z "${DB_URL}" ]]; then
  echo "Usage: SUPABASE_DB_URL='postgresql://...' $0"
  echo "   or: $0 'postgresql://USER:PASSWORD@HOST:PORT/DB'"
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
outfile="supabase-schema-${timestamp}.sql"

echo "Dumping schema from: ${DB_URL}"
echo "Output file: ${outfile}"

pg_dump \
  --dbname="${DB_URL}" \
  --schema-only \
  --schema=public \
  --schema=auth \
  --schema=storage \
  --no-owner \
  --no-privileges \
  --file="${outfile}"

echo "Done. Schema written to ${outfile}"

