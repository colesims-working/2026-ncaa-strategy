import { useState } from "react";
import {
  ALL_DRAFTERS,
  DRAFTER_LABELS,
  OUR_DRAFTERS,
  DRAFTER_COLORS,
  PLAYER_NAMES,
} from "../data/constants.js";

export function RosterPanel({ picks, onReassign, onRemove }) {
  const rosters = {};
  ALL_DRAFTERS.forEach((d) => { rosters[d] = []; });
  Object.entries(picks).forEach(([name, drafter]) => {
    if (rosters[drafter]) rosters[drafter].push(name);
  });

  return (
    <div className="roster-panel">
      <div className="roster-grid">
        {ALL_DRAFTERS.map((d) => (
          <div
            key={d}
            className={`roster-column ${OUR_DRAFTERS.has(d) ? "roster-column--ours" : ""}`}
            style={{
              background: OUR_DRAFTERS.has(d) ? DRAFTER_COLORS[d] + "15" : undefined,
              borderColor: OUR_DRAFTERS.has(d) ? DRAFTER_COLORS[d] + "30" : undefined,
            }}
          >
            <div className="roster-header" style={{ color: DRAFTER_COLORS[d] }}>
              {DRAFTER_LABELS[d]} ({rosters[d].length})
            </div>
            {rosters[d].map((name) => (
              <div key={name} className="roster-entry">
                <span className="roster-name">
                  {name}
                  {!PLAYER_NAMES.has(name) && <span className="unlisted-marker"> *</span>}
                </span>
                <span className="roster-actions">
                  <select
                    aria-label={`Reassign ${name}`}
                    value={d}
                    onChange={(e) => onReassign(name, e.target.value)}
                    className="roster-reassign-select"
                  >
                    {ALL_DRAFTERS.map((dd) => (
                      <option key={dd} value={dd}>{DRAFTER_LABELS[dd]}</option>
                    ))}
                  </select>
                  <button
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemove(name)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </span>
              </div>
            ))}
            {!rosters[d].length && <div className="roster-empty">—</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function UnlistedInput({ onAdd }) {
  const [name, setName] = useState("");
  const [drafter, setDrafter] = useState("lee");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, drafter);
    setName("");
  };

  return (
    <div className="unlisted-input">
      <span className="unlisted-label">Unlisted pick:</span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
        placeholder="Player name"
        aria-label="Unlisted player name"
        className="unlisted-name-input"
      />
      <select
        aria-label="Drafter for unlisted player"
        value={drafter}
        onChange={(e) => setDrafter(e.target.value)}
        className="unlisted-drafter-select"
      >
        {ALL_DRAFTERS.map((d) => (
          <option key={d} value={d}>{DRAFTER_LABELS[d]}</option>
        ))}
      </select>
      <button onClick={handleAdd} className="btn-add">Add</button>
    </div>
  );
}
