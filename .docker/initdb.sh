#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER jira WITH PASSWORD 'jira123';
    CREATE SCHEMA IF NOT EXISTS jira AUTHORIZATION jira;
EOSQL
