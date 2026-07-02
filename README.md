# Taddy Webhook Example

A webhook receiver and processor for [Taddy](https://taddy.org) podcast data. Receives webhook events via an Express server, enqueues them in Valkey, and processes them with a background worker that upserts data into PostgreSQL.

## Architecture

```
Taddy webhook → Express server → Valkey queue → Worker → PostgreSQL
```

1. **Server** (`src/server.ts`) — Receives `POST /webhooks/taddy` requests, validates the webhook secret, and enqueues the payload.
2. **Queue** (`src/queue/`) — Uses Valkey (Redis-compatible) as a FIFO queue via `LPUSH`/`BRPOP`.
3. **Worker** (`src/worker.ts`) — Polls the queue and upserts `PODCASTSERIES` and `PODCASTEPISODE` events into PostgreSQL using Drizzle ORM.

## Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [PostgreSQL](https://www.postgresql.org)
- [Valkey](https://valkey.io) or Redis
- [ngrok](https://ngrok.com) (for local development)

## Setup

```bash
# Clone the repo
git clone <repo-url>
cd webhook-example-taddy

# Install dependencies
npm install

# Copy the example env file and fill in your values
cp .env.example .env
```

### Configure environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server listen port | `3000` |
| `WEBHOOK_SECRET` | Secret sent by Taddy in `x-taddy-webhook-secret` header | — |
| `POSTGRES_USER` | PostgreSQL username | `user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `password` |
| `POSTGRES_DB` | PostgreSQL database name | `podcastdata` |
| `POSTGRES_PORT` | Host port to publish Postgres on | `5432` |

> **Note:** When running with Docker Compose, `DATABASE_URL` and `VALKEY_URL` are set automatically using the compose service names. The `POSTGRES_*` variables configure the PostgreSQL container. `POSTGRES_PORT` only changes the port published to your host — the container and the internal `DATABASE_URL` always use `5432`.

#### Install Docker

Install Docker (via `docker-ce`), enable the service, and allow your user to run containers without `sudo`:

```bash
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### Docker Compose

Start all services (PostgreSQL, Valkey, server, and worker) with Docker Compose:

```bash
cp .env.example .env   # edit .env with your values
docker compose up --build
```

Stop and clean up:

```bash
docker compose down
```

To remove the persisted PostgreSQL data as well:

```bash
docker compose down -v
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm run worker` | Start dev worker with hot reload |
| `npm run worker:start` | Run compiled worker |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly to database |
| `npm run db:studio` | Open Drizzle Studio GUI |

## How It Works

1. Taddy sends a `POST` request to `/webhooks/taddy` with a JSON payload containing `uuid`, `taddyType`, `action`, `timestamp`, `data`, and `matchingFilters`.
2. The server validates the `x-taddy-webhook-secret` header against `WEBHOOK_SECRET`.
3. The payload is pushed onto a Valkey list (`webhook:events`).
4. The worker blocks on the queue with `BRPOP` (5-second timeout) and processes events as they arrive.
5. Based on `taddyType`, the worker upserts the record into the `podcastseries` or `podcastepisode` table using Drizzle's `onConflictDoUpdate` (keyed on `uuid`).
