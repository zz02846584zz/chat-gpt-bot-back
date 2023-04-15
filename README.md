# Launch a project docker:

dev:

1.  run command <npm ci>
2.  run command in root directory <cp .env.example .env>
3.  set variables to .env (not required)
4.  create folder in root directory docker-entrypoint-initdb.d
5.  create file in this folder create-db.sql
6.  paste this code into the file create-db.sql:
    CREATE DATABASE nika_gpt_bot;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
7.  run command <docker-compose up --build -d> (download docker/docker desktop if you don't have it)
8.  run command in root directory <npx prisma generate --schema=./prisma/schema.prisma>
9.  run command <npm run dev>
10. open in browser http://[::1]:5100/

# migrations

1. npx prisma migrate dev - for dev
2. npx prisma migrate prod - for prod
3. npx prisma migrate dev --name <name> - create new migration

# git

Current branch - main

# Docs

Postman REST API: later
