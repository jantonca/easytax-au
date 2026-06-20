-- Enable the uuid-ossp extension on first database initialization.
-- The schema uses uuid_generate_v4() for primary keys (see TypeORM entities).
-- Runs once, as the Postgres superuser, via /docker-entrypoint-initdb.d.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
