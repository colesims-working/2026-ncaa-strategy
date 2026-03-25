# Draft HQ

Real-time NCAA tournament draft strategy board. Two users (Cole + Chris) coordinate picks across devices during a live 5-person snake draft.

## Features

- **Real-time sync** — Server-Sent Events push state instantly between devices; 5s polling fallback if SSE drops
- **Snake draft tracking** — 5 drafters × 10 rounds, auto-advancing turn indicator
- **Strategy engine** — Adjusted scores penalize team/region/partner overlap; chalk vs. variance board modes
- **Opponent blind spots** — Flags players opponents can't see (not in ChatGPT's training data)
- **Injury warnings** — Red-highlighted rows for players with injury concerns
- **Dark mode** — Full dark theme with accessible contrast ratios
- **Atomic persistence** — State written via tmp+rename to prevent corruption
- **Docker-ready** — Single-container deployment with health checks

## Architecture

```
client/          React 18 + Vite 5 SPA
  src/App.jsx               Root component (composition)
  src/App.css               All styles (extracted from inline)
  src/main.jsx              Entry point
  src/data/players.js       Player dataset (Monte Carlo sim results)
  src/data/constants.js     Draft config, colors, timing, player sets
  src/hooks/useSync.js      SSE + polling real-time sync hook
  src/utils/scoring.js      Adjusted score, snake order, roster summary
  src/components/DraftControls.jsx  RosterPanel + UnlistedInput
  index.html                HTML shell with dark mode defaults
  vite.config.js            Dev proxy config

server/          Express 4 API
  index.js       REST API + SSE + static file serving
  test.js        53-test suite (Node built-in test runner + supertest)

Dockerfile       Multi-stage build (build client → serve from Express)
docker-compose.yml  Production deployment config
```

## Quick Start

### Docker (recommended)

```sh
docker compose up -d --build
```

App runs at `http://localhost:3001`.

### Local Development

```sh
# Terminal 1: API server
cd server && npm install && npm start

# Terminal 2: Client dev server (hot reload)
cd client && npm install && npm run dev
```

Client dev server proxies API requests to `localhost:3001` automatically.

## API

| Method | Endpoint    | Description                     |
|--------|-------------|---------------------------------|
| GET    | `/health`   | Health check (200 OK)           |
| GET    | `/state`    | Current draft state             |
| GET    | `/events`   | SSE stream (real-time push)     |
| POST   | `/pick`     | Draft a player `{player, drafter}` |
| POST   | `/unpick`   | Remove a pick `{player}`        |
| POST   | `/settings` | Update chalk user / seats       |
| POST   | `/state`    | Full state replacement (reset)  |

## Configuration

| Variable       | Default       | Description                          |
|----------------|---------------|--------------------------------------|
| `PORT`         | `3001`        | Server port                          |
| `STATE_DIR`    | `./server`    | Directory for `state.json` persistence |
| `DRAFT_KEY`    | _(empty)_     | Optional auth key for write endpoints (`x-draft-key` header) |
| `VITE_API_URL` | _(empty)_     | Client API base URL (only for separate dev server) |

## Testing

```sh
cd server && npm test
```

53 tests covering all endpoints, concurrent pick safety, SSE broadcast, input validation, and edge cases.

## Draft Order

| Seat | Drafter |
|------|---------|
| 1    | Hunter  |
| 2    | Cole    |
| 3    | Eric    |
| 4    | Chris   |
| 5    | Lee     |

Snake draft: odd rounds go 1→5, even rounds go 5→1. 10 rounds, 50 total picks.

## Deployment

### Cloudflare Tunnel

If running behind a Cloudflare Tunnel on a separate machine:

```sh
cloudflared tunnel --url http://<host-ip>:3001
```

### Security

- Set `DRAFT_KEY` in production to require auth on all write endpoints
- Container runs as non-root `node` user
- Request body limited to 100KB
- Drafter names validated server-side against allowlist

## License

Private — not for redistribution.
