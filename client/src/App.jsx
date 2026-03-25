import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import "./App.css";
import PLAYERS from "./data/players.js";
import {
  TOTAL_PICKS,
  FLASH_DURATION_MS,
  TOP_HIGHLIGHT_COUNT,
  ALL_DRAFTERS,
  DRAFTER_LABELS,
  OUR_DRAFTERS,
  DRAFTER_COLORS,
  REGION_BACKGROUNDS,
  INJURED_PLAYERS,
  KNOWN_TO_OPPONENTS,
} from "./data/constants.js";
import { calcAdjustedScore, buildSnakeOrder, summarizeRoster } from "./utils/scoring.js";
import useSync from "./hooks/useSync.js";
import { RosterPanel, UnlistedInput } from "./components/DraftControls.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const { draftState, pick, unpick, updateSettings, reset, syncError, lastAction } = useSync();
  const [blindOnly, setBlindOnly] = useState(false);
  const [showRosters, setShowRosters] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const tableRef = useRef(null);
  const scrollRef = useRef(0);
  const { picks, chalkUser, seats } = draftState;

  // Scroll preservation across re-renders
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const onScroll = () => { scrollRef.current = el.scrollTop; };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (tableRef.current) tableRef.current.scrollTop = scrollRef.current;
  });

  const draft = useCallback((name, drafter) => { if (picks[name]) return; pick(name, drafter); }, [pick, picks]);
  const undraft = useCallback((name) => unpick(name), [unpick]);
  const reassign = useCallback((name, drafter) => pick(name, drafter), [pick]);
  const setChalk = useCallback((u) => updateSettings({ chalkUser: u }), [updateSettings]);
  const doReset = useCallback(() => { reset(); setConfirmReset(false); }, [reset]);

  const colePicks = useMemo(() => Object.entries(picks).filter(([, d]) => d === "cole").map(([n]) => n), [picks]);
  const chrisPicks = useMemo(() => Object.entries(picks).filter(([, d]) => d === "chris").map(([n]) => n), [picks]);
  const boardType = user === chalkUser ? "chalk" : "variance";
  const myPicks = user === "cole" ? colePicks : chrisPicks;
  const partnerPicks = user === "cole" ? chrisPicks : colePicks;

  const allSeatsSet = ALL_DRAFTERS.every((d) => seats[d]);
  const allSeatsUnique = allSeatsSet && new Set(Object.values(seats)).size === ALL_DRAFTERS.length;
  const snakeOrder = useMemo(() => (allSeatsSet && allSeatsUnique) ? buildSnakeOrder(seats) : [], [seats, allSeatsSet, allSeatsUnique]);
  const totalPicked = Object.keys(picks).length;
  const draftComplete = totalPicked >= TOTAL_PICKS;
  const currentDrafter = snakeOrder.length > 0 && !draftComplete ? snakeOrder[totalPicked] : null;
  const isMyTurn = currentDrafter === user;

  // Flash highlight for most recent pick
  const [flashPlayer, setFlashPlayer] = useState(null);
  useEffect(() => {
    if (!lastAction) return;
    setFlashPlayer(lastAction.player);
    const timer = setTimeout(() => setFlashPlayer(null), FLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [lastAction]);

  const ranked = useMemo(() => {
    if (!user) return [];
    return PLAYERS.map((p) => ({
      ...p,
      adj: calcAdjustedScore(p, boardType, myPicks, partnerPicks),
      drafted: picks[p.name] || null,
      blind: !KNOWN_TO_OPPONENTS.has(p.name),
    }))
      .filter((p) => !blindOnly || p.blind)
      .sort((a, b) => {
        const aDrafted = !!a.drafted;
        const bDrafted = !!b.drafted;
        if (aDrafted !== bDrafted) return aDrafted ? 1 : -1;
        if (aDrafted && bDrafted) {
          const aIsOpponent = !OUR_DRAFTERS.has(a.drafted);
          const bIsOpponent = !OUR_DRAFTERS.has(b.drafted);
          if (aIsOpponent !== bIsOpponent) return aIsOpponent ? 1 : -1;
        }
        return b.adj - a.adj;
      });
  }, [user, boardType, myPicks, partnerPicks, picks, blindOnly]);

  const coleSummary = summarizeRoster(colePicks);
  const chrisSummary = summarizeRoster(chrisPicks);

  // ── Login screen ──
  if (!user) {
    return (
      <div className="login-screen">
        <h1>Draft HQ</h1>
        <p>Syncs live between devices</p>
        <div className="login-buttons">
          {[["cole", "Cole", "#3b82f6"], ["chris", "Chris", "#a78bfa"]].map(([id, label, color]) => (
            <button
              key={id}
              onClick={() => setUser(id)}
              className="btn-login"
              style={{ background: color, boxShadow: `0 2px 12px ${color}55` }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const boardColor = boardType === "chalk" ? "#1e40af" : "#7c3aed";

  return (
    <div className="app">
      {/* Sync error banner */}
      {syncError && (
        <div role="alert" className="sync-error-banner">
          ⚠ Sync error — check your connection. Picks may not be saving.
        </div>
      )}

      {/* Turn banner */}
      {draftComplete ? (
        <div role="status" className="turn-banner turn-banner--complete">
          DRAFT COMPLETE — {TOTAL_PICKS}/{TOTAL_PICKS} picks
        </div>
      ) : currentDrafter && (
        <div
          role="status"
          className={`turn-banner turn-banner--active ${isMyTurn ? "turn-banner--my-turn" : "turn-banner--default"}`}
          style={!isMyTurn && OUR_DRAFTERS.has(currentDrafter) ? {
            background: DRAFTER_COLORS[currentDrafter] + "20",
            color: DRAFTER_COLORS[currentDrafter],
            border: "1px solid #2a2d3a",
          } : undefined}
        >
          {isMyTurn ? `YOUR PICK (#${totalPicked + 1})` : `${DRAFTER_LABELS[currentDrafter]}'s pick (#${totalPicked + 1})`}
        </div>
      )}

      {/* Config bar */}
      <div className="config-bar">
        <div className="config-left">
          <span className="config-title">Draft HQ</span>
          <span className="config-badge" style={{ color: boardColor, background: boardColor + "25" }}>
            {DRAFTER_LABELS[user]} / {boardType.toUpperCase()}
          </span>
        </div>
        <div className="config-right">
          <label className="blind-only-label">
            <input type="checkbox" checked={blindOnly} onChange={(e) => setBlindOnly(e.target.checked)} className="blind-only-checkbox" />
            Blind only
          </label>
          <span className="config-separator">·</span>
          <span className="config-label">Chalk:</span>
          {["cole", "chris"].map((u) => (
            <button
              key={u}
              onClick={() => setChalk(u)}
              aria-label={`Set chalk to ${DRAFTER_LABELS[u]}`}
              className={`btn-chalk ${chalkUser === u ? "btn-chalk--active" : "btn-chalk--inactive"}`}
              style={chalkUser === u ? { background: DRAFTER_COLORS[u], border: `1px solid ${DRAFTER_COLORS[u]}` } : undefined}
            >
              {DRAFTER_LABELS[u]}
            </button>
          ))}
          <span className="config-separator">·</span>
          <span className="config-label">Order: Hunter→Cole→Eric→Chris→Lee</span>
          <span className="config-separator">·</span>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn-reset">Reset</button>
          ) : (
            <>
              <button onClick={doReset} className="btn-reset-confirm">Yes, reset</button>
              <button onClick={() => setConfirmReset(false)} className="btn-reset-cancel">Cancel</button>
            </>
          )}
        </div>
      </div>

      {/* Roster summaries */}
      <div className="roster-summaries">
        {[
          ["Cole", colePicks, coleSummary, "cole"],
          ["Chris", chrisPicks, chrisSummary, "chris"],
        ].map(([label, playerNames, summary, id]) => (
          <div
            key={id}
            className={`roster-summary ${id !== user ? "roster-summary--default" : ""}`}
            style={id === user ? {
              background: DRAFTER_COLORS[id] + "15",
              borderRadius: 4,
              border: `2px solid ${DRAFTER_COLORS[id]}30`,
            } : undefined}
          >
            <div className="summary-header">
              <strong style={{ color: DRAFTER_COLORS[id] }}>
                {label} ({summary.count}/10) {id === chalkUser ? "CHALK" : "VAR"}
              </strong>
              <span className="summary-ev">E[pts] {summary.totalEv}</span>
            </div>
            <div className="summary-players">
              {playerNames.map((n) => {
                const p = PLAYERS.find((x) => x.name === n);
                return p ? p.name.split(" ").pop() : n;
              }).join(", ") || "—"}
            </div>
            <div className="summary-meta">
              Blind:{summary.blindCount} | {Object.entries(summary.regionCounts).map(([r, c]) => `${r[0]}${c}`).join(" ") || "none"}
            </div>
          </div>
        ))}
      </div>

      {/* Unlisted player input */}
      <UnlistedInput onAdd={draft} />

      {/* Draft board */}
      <div ref={tableRef} className="board-container">
        <table className="board-table">
          <thead>
            <tr style={{ background: boardColor }}>
              {["#", "Player", "Team", "Sd", "Rgn", "PPG", "EV", "P90", "Adj", ""].map((header, i) => (
                <th key={i} scope="col" style={{ textAlign: i === 1 || i === 2 ? "left" : "center" }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((player, i) => {
              const drafter = player.drafted;
              const isOurPick = OUR_DRAFTERS.has(drafter);
              const isOpponent = drafter && !isOurPick;
              const isFlash = flashPlayer === player.name;

              let rowClass = i % 2 === 0 ? "row-even" : "row-odd";
              if (isFlash) rowClass = "row-flash";
              else if (INJURED_PLAYERS.has(player.name) && !drafter) rowClass = "row-injury";
              else if (i < TOP_HIGHLIGHT_COUNT && !drafter) rowClass = "row-top";

              const rowStyle = {
                background: drafter ? (isOurPick ? DRAFTER_COLORS[drafter] + "18" : "#18181b") : undefined,
                opacity: isOpponent ? 0.35 : 1,
                transition: "background-color 0.5s ease",
              };

              return (
                <tr key={player.name} className={!drafter ? rowClass : undefined} style={rowStyle}>
                  <td className={`cell-rank ${i < TOP_HIGHLIGHT_COUNT && !drafter ? "cell-rank--top" : ""}`}>
                    {drafter ? "—" : i + 1}
                  </td>
                  <td className="cell-player">
                    {isOpponent ? <s className="player-opponent">{player.name}</s> : player.name}
                    {player.blind && <span className="badge-blind">B</span>}
                    {INJURED_PLAYERS.has(player.name) && <span className="badge-injury">INJ?</span>}
                  </td>
                  <td className="cell-team">{player.team}</td>
                  <td className="cell-seed">{player.seed}</td>
                  <td className="cell-region" style={{ background: REGION_BACKGROUNDS[player.region] }}>{player.region[0]}</td>
                  <td className="cell-ppg">{player.ppg}</td>
                  <td className="cell-stat">{player.ev.toFixed(0)}</td>
                  <td className="cell-stat">{player.p90.toFixed(0)}</td>
                  <td className="cell-adj">{drafter ? "—" : player.adj.toFixed(1)}</td>
                  <td className="cell-actions">
                    {drafter ? (
                      <span className="actions-drafted">
                        <select
                          aria-label={`Reassign ${player.name}`}
                          value={drafter}
                          onChange={(e) => reassign(player.name, e.target.value)}
                          className="reassign-select"
                          style={{ color: DRAFTER_COLORS[drafter] }}
                        >
                          {ALL_DRAFTERS.map((dd) => (
                            <option key={dd} value={dd}>{DRAFTER_LABELS[dd]}</option>
                          ))}
                        </select>
                        <button aria-label={`Undraft ${player.name}`} onClick={() => undraft(player.name)} className="btn-undraft">✕</button>
                      </span>
                    ) : (
                      <span className="actions-available">
                        {ALL_DRAFTERS.map((dr) => (
                          <button
                            key={dr}
                            aria-label={`Draft ${player.name} for ${DRAFTER_LABELS[dr]}`}
                            onClick={() => draft(player.name, dr)}
                            className={`btn-draft ${dr === user ? "btn-draft--self" : OUR_DRAFTERS.has(dr) ? "btn-draft--partner" : "btn-draft--opponent"}`}
                            style={{
                              background: dr === user ? DRAFTER_COLORS[dr] : OUR_DRAFTERS.has(dr) ? DRAFTER_COLORS[dr] + "30" : undefined,
                              color: OUR_DRAFTERS.has(dr) && dr !== user ? DRAFTER_COLORS[dr] : undefined,
                            }}
                          >
                            {DRAFTER_LABELS[dr]}
                          </button>
                        ))}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Roster panel toggle */}
      <button
        onClick={() => setShowRosters(!showRosters)}
        className={`btn-roster-toggle ${showRosters ? "btn-roster-toggle--active" : "btn-roster-toggle--inactive"}`}
      >
        {showRosters ? "Hide" : "Show"} All Rosters ({totalPicked} picks)
      </button>
      {showRosters && <RosterPanel picks={picks} onReassign={reassign} onRemove={undraft} />}

      <div className="legend">
        <b className="legend-blind">B</b> = blind to opponents · <b className="legend-injury">INJ?</b> = injury concern · Adj = score w/ team/region/partner penalties · Syncs in real-time · * = unlisted player
      </div>
    </div>
  );
}
