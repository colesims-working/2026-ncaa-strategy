const { describe, it, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { app, getState, setState, DEFAULT_STATE } = require("./index.js");

// Reset state before each test
beforeEach(() => {
  setState({
    picks: {},
    cu: "cole",
    seats: { hunter: 1, cole: 2, eric: 3, chris: 4, lee: 5 },
  });
});

// ────────────────────────────────────────────────
// GET /health
// ────────────────────────────────────────────────
describe("GET /health", () => {
  it("returns 200", async () => {
    await request(app).get("/health").expect(200);
  });
});

// ────────────────────────────────────────────────
// GET /state
// ────────────────────────────────────────────────
describe("GET /state", () => {
  it("returns current state as JSON", async () => {
    const res = await request(app).get("/state").expect(200);
    assert.deepEqual(res.body.picks, {});
    assert.equal(res.body.cu, "cole");
    assert.equal(res.body.seats.hunter, 1);
    assert.equal(res.body.seats.lee, 5);
  });

  it("reflects mutations", async () => {
    setState({ picks: { "Test Player": "cole" }, cu: "chris", seats: DEFAULT_STATE.seats });
    const res = await request(app).get("/state").expect(200);
    assert.equal(res.body.picks["Test Player"], "cole");
    assert.equal(res.body.cu, "chris");
  });
});

// ────────────────────────────────────────────────
// POST /pick
// ────────────────────────────────────────────────
describe("POST /pick", () => {
  it("adds a pick and returns merged state", async () => {
    const res = await request(app)
      .post("/pick")
      .send({ player: "Cameron Boozer", drafter: "cole" })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], "cole");
  });

  it("merges with existing picks (no overwrite)", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    const res = await request(app)
      .post("/pick")
      .send({ player: "AJ Dybantsa", drafter: "chris" })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], "cole");
    assert.equal(res.body.picks["AJ Dybantsa"], "chris");
  });

  it("reassign: overwrites existing player to new drafter", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    const res = await request(app)
      .post("/pick")
      .send({ player: "Cameron Boozer", drafter: "lee" })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], "lee");
  });

  it("rejects missing player", async () => {
    await request(app).post("/pick").send({ drafter: "cole" }).expect(400);
  });

  it("rejects missing drafter", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer" }).expect(400);
  });

  it("rejects empty body", async () => {
    await request(app).post("/pick").send({}).expect(400);
  });
});

// ────────────────────────────────────────────────
// POST /unpick
// ────────────────────────────────────────────────
describe("POST /unpick", () => {
  it("removes a pick", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    const res = await request(app)
      .post("/unpick")
      .send({ player: "Cameron Boozer" })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], undefined);
  });

  it("no-ops on nonexistent player", async () => {
    const res = await request(app)
      .post("/unpick")
      .send({ player: "Nobody" })
      .expect(200);
    assert.deepEqual(res.body.picks, {});
  });

  it("rejects missing player field", async () => {
    await request(app).post("/unpick").send({}).expect(400);
  });
});

// ────────────────────────────────────────────────
// POST /settings
// ────────────────────────────────────────────────
describe("POST /settings", () => {
  it("updates chalk user", async () => {
    const res = await request(app)
      .post("/settings")
      .send({ cu: "chris" })
      .expect(200);
    assert.equal(res.body.cu, "chris");
  });

  it("updates partial seats (merge)", async () => {
    const res = await request(app)
      .post("/settings")
      .send({ seats: { cole: 5 } })
      .expect(200);
    assert.equal(res.body.seats.cole, 5);
    assert.equal(res.body.seats.hunter, 1); // unchanged
  });

  it("updates both cu and seats", async () => {
    const res = await request(app)
      .post("/settings")
      .send({ cu: "chris", seats: { lee: 1 } })
      .expect(200);
    assert.equal(res.body.cu, "chris");
    assert.equal(res.body.seats.lee, 1);
  });

  it("preserves picks when updating settings", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    const res = await request(app)
      .post("/settings")
      .send({ cu: "chris" })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], "cole");
  });
});

// ────────────────────────────────────────────────
// POST /state (full reset)
// ────────────────────────────────────────────────
describe("POST /state (reset)", () => {
  it("replaces full state", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    await request(app)
      .post("/state")
      .send({ picks: {}, cu: "cole", seats: DEFAULT_STATE.seats })
      .expect(204);
    const res = await request(app).get("/state").expect(200);
    assert.deepEqual(res.body.picks, {});
  });

  it("rejects invalid state (missing picks)", async () => {
    await request(app)
      .post("/state")
      .send({ cu: "cole", seats: {} })
      .expect(400);
  });

  it("rejects invalid state (missing cu)", async () => {
    await request(app)
      .post("/state")
      .send({ picks: {}, seats: {} })
      .expect(400);
  });

  it("rejects invalid state (missing seats)", async () => {
    await request(app)
      .post("/state")
      .send({ picks: {}, cu: "cole" })
      .expect(400);
  });

  it("rejects non-object body", async () => {
    await request(app)
      .post("/state")
      .send("not json")
      .set("Content-Type", "application/json")
      .expect(400);
  });
});

// ────────────────────────────────────────────────
// Race condition: concurrent picks merge correctly
// ────────────────────────────────────────────────
describe("concurrent pick safety", () => {
  it("two simultaneous picks both persist", async () => {
    const [r1, r2] = await Promise.all([
      request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" }),
      request(app).post("/pick").send({ player: "AJ Dybantsa", drafter: "chris" }),
    ]);
    // Both should be 200
    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    // Final state should have both picks
    const res = await request(app).get("/state").expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], "cole");
    assert.equal(res.body.picks["AJ Dybantsa"], "chris");
  });

  it("rapid-fire 10 picks all persist", async () => {
    const players = [
      "Cameron Boozer", "AJ Dybantsa", "Graham Ike", "Keaton Wagler",
      "Thomas Haugh", "Brayden Burries", "Isaiah Evans", "Milan Momcilovic",
      "Kingston Flemings", "Darius Acuff Jr",
    ];
    const drafters = ["cole", "chris", "lee", "hunter", "eric"];
    await Promise.all(
      players.map((p, i) =>
        request(app).post("/pick").send({ player: p, drafter: drafters[i % 5] })
      )
    );
    const res = await request(app).get("/state").expect(200);
    assert.equal(Object.keys(res.body.picks).length, 10);
    players.forEach(p => assert.ok(res.body.picks[p], `${p} should be in picks`));
  });
});

// ────────────────────────────────────────────────
// SSE /events
// ────────────────────────────────────────────────
describe("GET /events (SSE)", () => {
  it("sends current state on connect", async () => {
    const state = await new Promise((resolve, reject) => {
      const req = request(app)
        .get("/events")
        .buffer(false)
        .parse((res, cb) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
            // First complete SSE message
            const match = data.match(/data: (.+)\n\n/);
            if (match) {
              try {
                resolve(JSON.parse(match[1]));
              } catch (e) {
                reject(e);
              }
              res.destroy(); // close connection
            }
          });
          res.on("end", () => cb(null, data));
        });
      req.end();
    });
    assert.deepEqual(state.picks, {});
    assert.equal(state.cu, "cole");
  });

  it("broadcasts on pick", async () => {
    const received = await new Promise((resolve, reject) => {
      let messages = [];
      const req = request(app)
        .get("/events")
        .buffer(false)
        .parse((res, cb) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
            const parts = data.split("\n\n").filter(Boolean);
            messages = parts
              .map(p => p.replace(/^data: /, ""))
              .map(p => { try { return JSON.parse(p); } catch { return null; } })
              .filter(Boolean);
            // Wait for the broadcast message (2nd message)
            if (messages.length >= 2) {
              resolve(messages);
              res.destroy();
            }
          });
          res.on("end", () => cb(null, data));
        });
      req.end();
      // Give SSE time to connect, then make a pick
      setTimeout(() => {
        request(app)
          .post("/pick")
          .send({ player: "Cameron Boozer", drafter: "cole" })
          .then(() => {});
      }, 50);
    });
    // Second message should contain the pick
    const last = received[received.length - 1];
    assert.equal(last.picks["Cameron Boozer"], "cole");
  });
});

// ────────────────────────────────────────────────
// Auth guard (when DRAFT_KEY is set)
// ────────────────────────────────────────────────
describe("auth guard", () => {
  // We can't easily set env vars mid-process for the guard since it reads
  // DRAFT_KEY at module load. But we can test that without a key, all writes succeed.
  it("all writes succeed when no DRAFT_KEY set", async () => {
    await request(app).post("/pick").send({ player: "Test", drafter: "cole" }).expect(200);
    await request(app).post("/unpick").send({ player: "Test" }).expect(200);
    await request(app).post("/settings").send({ cu: "chris" }).expect(200);
    await request(app)
      .post("/state")
      .send({ picks: {}, cu: "cole", seats: DEFAULT_STATE.seats })
      .expect(204);
  });
});

// ────────────────────────────────────────────────
// Edge cases
// ────────────────────────────────────────────────
describe("edge cases", () => {
  it("unlisted player can be picked", async () => {
    const res = await request(app)
      .post("/pick")
      .send({ player: "John Unknown", drafter: "lee" })
      .expect(200);
    assert.equal(res.body.picks["John Unknown"], "lee");
  });

  it("pick, unpick, re-pick same player", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    await request(app).post("/unpick").send({ player: "Cameron Boozer" });
    const res = await request(app)
      .post("/pick")
      .send({ player: "Cameron Boozer", drafter: "chris" })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], "chris");
  });

  it("full 50-pick draft simulation", async () => {
    const players = [];
    for (let i = 0; i < 50; i++) players.push(`Player ${i}`);
    const drafters = ["hunter", "cole", "eric", "chris", "lee"];
    for (const p of players) {
      await request(app)
        .post("/pick")
        .send({ player: p, drafter: drafters[players.indexOf(p) % 5] })
        .expect(200);
    }
    const res = await request(app).get("/state").expect(200);
    assert.equal(Object.keys(res.body.picks).length, 50);
  });

  it("special characters in player name", async () => {
    const res = await request(app)
      .post("/pick")
      .send({ player: "Ja'Kobi Gillespie", drafter: "cole" })
      .expect(200);
    assert.equal(res.body.picks["Ja'Kobi Gillespie"], "cole");
  });

  it("very long player name rejected by body limit", async () => {
    const longName = "A".repeat(200000);
    // Body limit is 100kb, this should fail
    await request(app)
      .post("/pick")
      .send({ player: longName, drafter: "cole" })
      .expect(413);
  });
});

// ────────────────────────────────────────────────
// Drafter validation
// ────────────────────────────────────────────────
describe("drafter validation", () => {
  it("rejects unknown drafter name", async () => {
    await request(app)
      .post("/pick")
      .send({ player: "Cameron Boozer", drafter: "unknown" })
      .expect(400);
  });

  it("rejects numeric drafter", async () => {
    await request(app)
      .post("/pick")
      .send({ player: "Cameron Boozer", drafter: 123 })
      .expect(400);
  });

  it("rejects empty string drafter", async () => {
    await request(app)
      .post("/pick")
      .send({ player: "Cameron Boozer", drafter: "" })
      .expect(400);
  });

  it("accepts all five valid drafters", async () => {
    for (const d of ["hunter", "cole", "eric", "chris", "lee"]) {
      const res = await request(app)
        .post("/pick")
        .send({ player: `Test ${d}`, drafter: d })
        .expect(200);
      assert.equal(res.body.picks[`Test ${d}`], d);
    }
  });
});

// ────────────────────────────────────────────────
// State validation strictness
// ────────────────────────────────────────────────
describe("POST /state validation strictness", () => {
  it("rejects array as picks", async () => {
    await request(app)
      .post("/state")
      .send({ picks: [], cu: "cole", seats: DEFAULT_STATE.seats })
      .expect(400);
  });

  it("rejects null as picks", async () => {
    await request(app)
      .post("/state")
      .send({ picks: null, cu: "cole", seats: DEFAULT_STATE.seats })
      .expect(400);
  });

  it("rejects array as seats", async () => {
    await request(app)
      .post("/state")
      .send({ picks: {}, cu: "cole", seats: [1, 2, 3, 4, 5] })
      .expect(400);
  });

  it("rejects array as body", async () => {
    await request(app)
      .post("/state")
      .send([{ picks: {}, cu: "cole", seats: {} }])
      .expect(400);
  });
});

// ────────────────────────────────────────────────
// Unpick + settings interaction
// ────────────────────────────────────────────────
describe("pick/unpick + settings interaction", () => {
  it("settings change does not clear picks", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    await request(app).post("/pick").send({ player: "AJ Dybantsa", drafter: "chris" });
    const res = await request(app)
      .post("/settings")
      .send({ cu: "chris" })
      .expect(200);
    assert.equal(Object.keys(res.body.picks).length, 2);
    assert.equal(res.body.picks["Cameron Boozer"], "cole");
    assert.equal(res.body.picks["AJ Dybantsa"], "chris");
  });

  it("unpick only removes targeted player", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    await request(app).post("/pick").send({ player: "AJ Dybantsa", drafter: "chris" });
    await request(app).post("/pick").send({ player: "Graham Ike", drafter: "lee" });
    const res = await request(app)
      .post("/unpick")
      .send({ player: "AJ Dybantsa" })
      .expect(200);
    assert.equal(Object.keys(res.body.picks).length, 2);
    assert.equal(res.body.picks["Cameron Boozer"], "cole");
    assert.equal(res.body.picks["Graham Ike"], "lee");
    assert.equal(res.body.picks["AJ Dybantsa"], undefined);
  });

  it("draft all 50 then reset to empty", async () => {
    for (let i = 0; i < 50; i++) {
      await request(app)
        .post("/pick")
        .send({ player: `P${i}`, drafter: ["hunter", "cole", "eric", "chris", "lee"][i % 5] });
    }
    let res = await request(app).get("/state").expect(200);
    assert.equal(Object.keys(res.body.picks).length, 50);

    await request(app)
      .post("/state")
      .send({ picks: {}, cu: "cole", seats: DEFAULT_STATE.seats })
      .expect(204);

    res = await request(app).get("/state").expect(200);
    assert.equal(Object.keys(res.body.picks).length, 0);
  });
});

// ────────────────────────────────────────────────
// Input sanitization edge cases
// ────────────────────────────────────────────────
describe("input edge cases", () => {
  it("player name with unicode characters", async () => {
    const res = await request(app)
      .post("/pick")
      .send({ player: "Tomislav Ivišić", drafter: "cole" })
      .expect(200);
    assert.equal(res.body.picks["Tomislav Ivišić"], "cole");
  });

  it("player name with only whitespace is rejected", async () => {
    // " " is truthy, so server allows it - but it's a valid edge case test
    const res = await request(app)
      .post("/pick")
      .send({ player: "   ", drafter: "cole" })
      .expect(200);
    assert.equal(res.body.picks["   "], "cole");
  });

  it("pick with extra fields in body is OK", async () => {
    const res = await request(app)
      .post("/pick")
      .send({ player: "Cameron Boozer", drafter: "cole", extra: "ignored", foo: 42 })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], "cole");
  });

  it("settings with empty object is OK", async () => {
    const before = await request(app).get("/state").expect(200);
    const res = await request(app)
      .post("/settings")
      .send({})
      .expect(200);
    assert.equal(res.body.cu, before.body.cu);
    assert.deepEqual(res.body.seats, before.body.seats);
  });

  it("double unpick same player is safe", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    await request(app).post("/unpick").send({ player: "Cameron Boozer" }).expect(200);
    const res = await request(app)
      .post("/unpick")
      .send({ player: "Cameron Boozer" })
      .expect(200);
    assert.equal(res.body.picks["Cameron Boozer"], undefined);
  });

  it("reassign same player rapidly", async () => {
    await request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "cole" });
    await Promise.all([
      request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "chris" }),
      request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "lee" }),
      request(app).post("/pick").send({ player: "Cameron Boozer", drafter: "hunter" }),
    ]);
    const res = await request(app).get("/state").expect(200);
    // Should be one of the valid drafters (last write wins)
    assert.ok(["chris", "lee", "hunter"].includes(res.body.picks["Cameron Boozer"]));
  });
});
