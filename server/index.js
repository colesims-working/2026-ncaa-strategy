"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;
const DRAFT_KEY = process.env.DRAFT_KEY || "";
const STATE_DIR = process.env.STATE_DIR || __dirname;
const STATE_FILE = path.join(STATE_DIR, "state.json");

app.use(express.json({ limit: "100kb" }));

const VALID_DRAFTERS = new Set(["hunter", "cole", "eric", "chris", "lee"]);
const VALID_SEATS = new Set([1, 2, 3, 4, 5]);

const DEFAULT_STATE = {
  picks: {},
  chalkUser: "cole",
  seats: { hunter: 1, cole: 2, eric: 3, chris: 4, lee: 5 },
};

// Load persisted state or start fresh
let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
} catch {
  state = { ...DEFAULT_STATE };
}

function persistState() {
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, STATE_FILE);
}

function isValidState(body) {
  return (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    typeof body.picks === "object" &&
    !Array.isArray(body.picks) &&
    body.picks !== null &&
    typeof body.chalkUser === "string" &&
    typeof body.seats === "object" &&
    !Array.isArray(body.seats) &&
    body.seats !== null
  );
}

// Auth middleware for writes
function authGuard(req, res, next) {
  if (!DRAFT_KEY) return next();
  if (req.headers["x-draft-key"] === DRAFT_KEY) return next();
  res.sendStatus(401);
}

// ── SSE: real-time push to all connected clients ──
const sseClients = new Set();

function broadcast() {
  const data = JSON.stringify(state);
  for (const res of sseClients) {
    res.write(`data: ${data}\n\n`);
  }
}

app.get("/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  // Send current state immediately on connect
  res.write(`data: ${JSON.stringify(state)}\n\n`);
  sseClients.add(res);
  // Heartbeat every 30s to prevent proxies/tunnels from killing idle connections
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 30000);
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

app.get("/health", (_req, res) => res.sendStatus(200));

app.get("/state", (_req, res) => {
  res.json(state);
});

// Full state replacement (used for reset)
app.post("/state", authGuard, (req, res) => {
  if (!isValidState(req.body)) return res.sendStatus(400);
  state = req.body;
  persistState();
  broadcast();
  res.sendStatus(204);
});

// Granular pick — merge-safe, eliminates race conditions
app.post("/pick", authGuard, (req, res) => {
  const { player, drafter } = req.body;
  if (!player || !drafter) return res.sendStatus(400);
  if (typeof player !== "string" || typeof drafter !== "string") return res.sendStatus(400);
  if (!VALID_DRAFTERS.has(drafter)) return res.sendStatus(400);
  state.picks[player] = drafter;
  persistState();
  broadcast();
  res.json(state);
});

app.post("/unpick", authGuard, (req, res) => {
  const { player } = req.body;
  if (!player) return res.sendStatus(400);
  delete state.picks[player];
  persistState();
  broadcast();
  res.json(state);
});

app.post("/settings", authGuard, (req, res) => {
  const { chalkUser, seats } = req.body;
  if (chalkUser !== undefined) {
    if (typeof chalkUser !== "string" || !VALID_DRAFTERS.has(chalkUser)) return res.sendStatus(400);
    state.chalkUser = chalkUser;
  }
  if (seats !== undefined) {
    if (typeof seats !== "object" || Array.isArray(seats) || seats === null) return res.sendStatus(400);
    for (const [name, seat] of Object.entries(seats)) {
      if (!VALID_DRAFTERS.has(name) || !VALID_SEATS.has(seat)) return res.sendStatus(400);
    }
    state.seats = { ...state.seats, ...seats };
  }
  persistState();
  broadcast();
  res.json(state);
});

// Serve built client
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res, next) => {
  const indexPath = path.join(clientDist, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  next();
});

// Export for testing
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Draft HQ server running on port ${PORT}`);
  });
}

module.exports = { app, getState: () => state, setState: (s) => { state = s; }, DEFAULT_STATE };
