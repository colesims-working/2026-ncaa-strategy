import PLAYERS from "./players.js";

// ── Draft structure ──
export const TOTAL_ROUNDS = 10;
export const DRAFTERS_PER_ROUND = 5;
export const TOTAL_PICKS = TOTAL_ROUNDS * DRAFTERS_PER_ROUND;

// ── Timing (ms) ──
export const SSE_ECHO_GUARD_MS = 300;
export const SSE_RECONNECT_MS = 3000;
export const SSE_ERROR_BANNER_DELAY_MS = 8000;
export const POLL_INTERVAL_MS = 5000;
export const POLL_WRITE_COOLDOWN_MS = 2000;
export const FLASH_DURATION_MS = 2000;
export const TOP_HIGHLIGHT_COUNT = 5;

// ── Drafter identity ──
export const ALL_DRAFTERS = ["cole", "chris", "lee", "hunter", "eric"];
export const DRAFTER_LABELS = { cole: "Cole", chris: "Chris", lee: "Lee", hunter: "Hunter", eric: "Eric" };
export const OUR_DRAFTERS = new Set(["cole", "chris"]);

// ── Colors ──
export const DRAFTER_COLORS = {
  cole: "#3b82f6",
  chris: "#a78bfa",
  lee: "#a1a1aa",
  hunter: "#a1a1aa",
  eric: "#a1a1aa",
};

export const REGION_BACKGROUNDS = {
  East: "#1e293b",
  West: "#2a1f14",
  Midwest: "#0f2922",
  South: "#2a1215",
};

// ── Player sets ──
export const PLAYER_NAMES = new Set(PLAYERS.map((p) => p.name));

export const INJURED_PLAYERS = new Set([
  "Nate Ament",
  "Braden Huff",
  "Patrick Ngongba II",
]);

// Players known to opponents (in ChatGPT's training data)
export const KNOWN_TO_OPPONENTS = new Set([
  "Cameron Boozer", "Thomas Haugh", "Brayden Burries", "Kingston Flemings",
  "Darius Acuff Jr", "Milan Momcilovic", "Joshua Jefferson", "Alex Condon",
  "Isaiah Evans", "Yaxel Lendeborg", "Emanuel Sharp", "Koa Peat",
  "Jaden Bradley", "Braden Smith", "Graham Ike", "Morez Johnson Jr",
  "Fletcher Loyer", "Zuby Ejiofor", "Trey Kaufman-Renn", "Labaron Philon Jr",
  "Patrick Ngongba II", "Tamin Lipsey", "Braden Huff", "Boogie Fland",
  "Xaivian Lee", "Tarris Reed Jr", "Rueben Chinyelu", "Motiejus Krivas",
  "Milos Uzan", "Solo Ball", "Thijs De Ridder", "Aday Mara",
  "Elliot Cadeau", "Alex Karaban", "Trey McKenney", "Tobe Awaka",
  "Curtis Jones", "Roddy Gayle Jr", "Adou Thiero", "Johnell Davis",
  "Nolan Hickman", "Kasparas Jakucionis", "Tomislav Ivisic", "Camden Heide",
  "Silas Demary Jr", "Braylon Mullins", "Connor Essegian", "Kylan Boswell",
  "Dame Sarr",
]);

// ── API ──
export const API_BASE = import.meta.env.VITE_API_URL || "";
export const JSON_HEADERS = { "Content-Type": "application/json" };

export const DEFAULT_STATE = {
  picks: {},
  chalkUser: "cole",
  seats: { hunter: 1, cole: 2, eric: 3, chris: 4, lee: 5 },
};
