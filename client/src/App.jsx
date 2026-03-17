import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ── Player data (10K Monte Carlo sim) ──
const P=[{"n":"Cameron Boozer","t":"Duke","s":1,"r":"East","ppg":22.5,"ev":102.5,"p90":144.7,"cs":101.76,"vs":119.36},{"n":"Brayden Burries","t":"Arizona","s":1,"r":"West","ppg":15.5,"ev":69.7,"p90":98.6,"cs":68.75,"vs":85.77},{"n":"Thomas Haugh","t":"Florida","s":1,"r":"South","ppg":17.2,"ev":69.1,"p90":104.6,"cs":66.85,"vs":95.53},{"n":"Isaiah Evans","t":"Duke","s":1,"r":"East","ppg":14.5,"ev":66.0,"p90":93.2,"cs":65.43,"vs":80.35},{"n":"Yaxel Lendeborg","t":"Michigan","s":1,"r":"Midwest","ppg":14.3,"ev":66.1,"p90":91.5,"cs":65.23,"vs":80.09},{"n":"Morez Johnson Jr","t":"Michigan","s":1,"r":"Midwest","ppg":14.2,"ev":65.8,"p90":91.4,"cs":65.15,"vs":79.61},{"n":"Graham Ike","t":"Gonzaga","s":3,"r":"West","ppg":19.7,"ev":65.3,"p90":100.4,"cs":62.48,"vs":112.63},{"n":"Milan Momcilovic","t":"Iowa State","s":2,"r":"Midwest","ppg":17.0,"ev":64.0,"p90":97.0,"cs":61.78,"vs":101.89},{"n":"Keaton Wagler","t":"Illinois","s":3,"r":"South","ppg":17.9,"ev":64.6,"p90":100.2,"cs":61.55,"vs":110.28},{"n":"Koa Peat","t":"Arizona","s":1,"r":"West","ppg":13.8,"ev":62.1,"p90":87.9,"cs":61.19,"vs":77.76},{"n":"Joshua Jefferson","t":"Iowa State","s":2,"r":"Midwest","ppg":16.6,"ev":62.4,"p90":94.9,"cs":60.09,"vs":100.49},{"n":"Jaden Bradley","t":"Arizona","s":1,"r":"West","ppg":13.4,"ev":60.3,"p90":85.2,"cs":59.55,"vs":75.42},{"n":"Darius Acuff Jr","t":"Arkansas","s":4,"r":"West","ppg":22.2,"ev":61.5,"p90":95.6,"cs":58.56,"vs":119.06},{"n":"Alex Condon","t":"Florida","s":1,"r":"South","ppg":14.8,"ev":59.5,"p90":90.1,"cs":57.45,"vs":84.82},{"n":"Kingston Flemings","t":"Houston","s":2,"r":"South","ppg":16.5,"ev":60.1,"p90":97.6,"cs":56.77,"vs":106.6},{"n":"Braden Huff","t":"Gonzaga","s":3,"r":"West","ppg":17.8,"ev":58.9,"p90":90.2,"cs":56.35,"vs":103.05},{"n":"Emanuel Sharp","t":"Houston","s":2,"r":"South","ppg":15.8,"ev":57.6,"p90":93.6,"cs":54.39,"vs":103.08},{"n":"Labaron Philon Jr","t":"Alabama","s":4,"r":"Midwest","ppg":21.5,"ev":54.7,"p90":82.9,"cs":52.34,"vs":109.26},{"n":"Braden Smith","t":"Purdue","s":2,"r":"West","ppg":14.9,"ev":53.4,"p90":82.8,"cs":51.22,"vs":92.07},{"n":"Trey Kaufman-Renn","t":"Purdue","s":2,"r":"West","ppg":14.5,"ev":52.0,"p90":80.1,"cs":49.86,"vs":89.4},{"n":"Aday Mara","t":"Michigan","s":1,"r":"Midwest","ppg":10.8,"ev":49.9,"p90":69.1,"cs":49.36,"vs":62.68},{"n":"Darryn Peterson","t":"Kansas","s":4,"r":"East","ppg":19.9,"ev":51.9,"p90":80.5,"cs":49.0,"vs":107.56},{"n":"AJ Dybantsa","t":"BYU","s":6,"r":"West","ppg":25.2,"ev":51.2,"p90":81.5,"cs":48.78,"vs":120.75},{"n":"Patrick Ngongba II","t":"Duke","s":1,"r":"East","ppg":10.7,"ev":48.7,"p90":68.7,"cs":48.35,"vs":61.65},{"n":"Tamin Lipsey","t":"Iowa State","s":2,"r":"Midwest","ppg":13.3,"ev":49.9,"p90":75.5,"cs":48.21,"vs":83.0},{"n":"Tyler Tanner","t":"Vanderbilt","s":5,"r":"South","ppg":19.2,"ev":50.9,"p90":83.6,"cs":48.05,"vs":109.42},{"n":"Fletcher Loyer","t":"Purdue","s":2,"r":"West","ppg":13.6,"ev":48.7,"p90":75.2,"cs":46.71,"vs":85.13},{"n":"Pryce Sandfort","t":"Nebraska","s":4,"r":"South","ppg":17.9,"ev":49.3,"p90":78.2,"cs":46.6,"vs":102.43},{"n":"Trey McKenney","t":"Michigan","s":1,"r":"Midwest","ppg":10.0,"ev":46.3,"p90":63.9,"cs":45.75,"vs":58.76},{"n":"Kylan Boswell","t":"Illinois","s":3,"r":"South","ppg":13.3,"ev":47.9,"p90":74.4,"cs":45.65,"vs":87.03},{"n":"Christian Anderson","t":"Texas Tech","s":5,"r":"Midwest","ppg":19.2,"ev":47.8,"p90":76.5,"cs":45.41,"vs":102.56},{"n":"John Blackwell","t":"Wisconsin","s":5,"r":"West","ppg":18.3,"ev":47.9,"p90":75.9,"cs":45.4,"vs":101.61},{"n":"Boogie Fland","t":"Florida","s":1,"r":"South","ppg":11.6,"ev":46.7,"p90":70.9,"cs":45.13,"vs":70.1},{"n":"Xaivian Lee","t":"Florida","s":1,"r":"South","ppg":11.6,"ev":46.7,"p90":70.7,"cs":45.01,"vs":70.16},{"n":"Rueben Chinyelu","t":"Florida","s":1,"r":"South","ppg":11.4,"ev":45.8,"p90":69.6,"cs":44.25,"vs":69.15},{"n":"Jeremy Fears Jr","t":"Michigan State","s":3,"r":"East","ppg":15.5,"ev":46.8,"p90":77.0,"cs":44.02,"vs":96.74},{"n":"Solo Ball","t":"UConn","s":2,"r":"East","ppg":13.9,"ev":45.3,"p90":71.8,"cs":43.07,"vs":86.04},{"n":"Tomislav Ivisic","t":"Illinois","s":3,"r":"South","ppg":12.5,"ev":45.0,"p90":70.1,"cs":42.88,"vs":83.16},{"n":"Tarris Reed Jr","t":"UConn","s":2,"r":"East","ppg":13.8,"ev":44.9,"p90":71.5,"cs":42.64,"vs":86.0},{"n":"Tobe Awaka","t":"Arizona","s":1,"r":"West","ppg":9.5,"ev":42.7,"p90":60.3,"cs":42.11,"vs":56.68},{"n":"Ryan Conwell","t":"Louisville","s":6,"r":"East","ppg":18.7,"ev":45.7,"p90":81.8,"cs":41.93,"vs":115.69},{"n":"Ja'Kobi Gillespie","t":"Tennessee","s":6,"r":"Midwest","ppg":18.0,"ev":45.0,"p90":78.1,"cs":41.76,"vs":109.22},{"n":"Nate Ament","t":"Tennessee","s":6,"r":"Midwest","ppg":18.0,"ev":44.9,"p90":78.1,"cs":41.72,"vs":109.1},{"n":"Elliot Cadeau","t":"Michigan","s":1,"r":"Midwest","ppg":9.0,"ev":41.7,"p90":57.8,"cs":41.22,"vs":54.12},{"n":"Nimari Burnett","t":"Michigan","s":1,"r":"Midwest","ppg":9.0,"ev":41.7,"p90":57.8,"cs":41.22,"vs":54.22},{"n":"Zuby Ejiofor","t":"St. John's","s":5,"r":"East","ppg":16.3,"ev":43.3,"p90":73.8,"cs":40.91,"vs":98.79},{"n":"Dame Sarr","t":"Duke","s":1,"r":"East","ppg":9.0,"ev":41.0,"p90":57.9,"cs":40.69,"vs":53.43},{"n":"Duke Miles","t":"Vanderbilt","s":5,"r":"South","ppg":15.9,"ev":42.3,"p90":69.1,"cs":39.89,"vs":94.55},{"n":"Alex Karaban","t":"UConn","s":2,"r":"East","ppg":12.9,"ev":42.0,"p90":66.7,"cs":39.83,"vs":81.6},{"n":"Milos Uzan","t":"Houston","s":2,"r":"South","ppg":11.5,"ev":42.0,"p90":68.4,"cs":39.66,"vs":81.59},{"n":"Adou Thiero","t":"Arkansas","s":4,"r":"West","ppg":15.0,"ev":41.6,"p90":65.5,"cs":39.61,"vs":88.16},{"n":"Mikel Brown Jr","t":"Louisville","s":6,"r":"East","ppg":16.0,"ev":39.2,"p90":70.7,"cs":35.96,"vs":104.38},{"n":"Donovan Atwell","t":"Texas Tech","s":5,"r":"Midwest","ppg":15.0,"ev":37.4,"p90":60.1,"cs":35.56,"vs":84.68},{"n":"Coen Carr","t":"Michigan State","s":3,"r":"East","ppg":12.5,"ev":37.8,"p90":62.4,"cs":35.55,"vs":82.99},{"n":"Bruce Thornton","t":"Ohio State","s":8,"r":"East","ppg":20.2,"ev":38.1,"p90":66.3,"cs":35.52,"vs":103.63},{"n":"Deivon Smith","t":"St. John's","s":5,"r":"East","ppg":13.0,"ev":34.6,"p90":58.7,"cs":32.68,"vs":83.53},{"n":"Nolan Winter","t":"Wisconsin","s":5,"r":"West","ppg":13.3,"ev":34.8,"p90":55.1,"cs":32.92,"vs":79.99},{"n":"Donovan Dent","t":"UCLA","s":7,"r":"East","ppg":15.0,"ev":33.8,"p90":60.2,"cs":31.33,"vs":92.87},{"n":"Tyler Bilodeau","t":"UCLA","s":7,"r":"East","ppg":14.5,"ev":32.8,"p90":57.9,"cs":30.4,"vs":90.22},{"n":"Owen Freeman","t":"Iowa","s":9,"r":"South","ppg":17.0,"ev":31.0,"p90":50.5,"cs":29.12,"vs":82.51},{"n":"Augustas Marciulionis","t":"Saint Mary's","s":7,"r":"South","ppg":16.0,"ev":30.8,"p90":54.6,"cs":28.56,"vs":91.8},{"n":"Otega Oweh","t":"Kentucky","s":7,"r":"Midwest","ppg":16.0,"ev":29.8,"p90":51.2,"cs":27.92,"vs":87.2},{"n":"Chase Hunter","t":"Clemson","s":8,"r":"South","ppg":17.0,"ev":28.2,"p90":48.9,"cs":25.31,"vs":96.33},{"n":"Connor Essegian","t":"Nebraska","s":4,"r":"South","ppg":14.0,"ev":38.5,"p90":61.7,"cs":36.5,"vs":85.27},{"n":"Nolan Hickman","t":"Gonzaga","s":3,"r":"West","ppg":12.0,"ev":39.6,"p90":61.3,"cs":37.87,"vs":76.24},{"n":"Kasparas Jakucionis","t":"Illinois","s":3,"r":"South","ppg":11.0,"ev":39.7,"p90":61.6,"cs":37.86,"vs":75.34},{"n":"Curtis Jones","t":"Iowa State","s":2,"r":"Midwest","ppg":10.0,"ev":37.7,"p90":57.2,"cs":36.34,"vs":66.87},{"n":"Roddy Gayle Jr","t":"Michigan","s":1,"r":"Midwest","ppg":8.5,"ev":39.4,"p90":54.5,"cs":38.87,"vs":51.82},{"n":"Motiejus Krivas","t":"Arizona","s":1,"r":"West","ppg":8.7,"ev":39.1,"p90":55.4,"cs":38.59,"vs":52.85},{"n":"Silas Demary Jr","t":"UConn","s":2,"r":"East","ppg":11.1,"ev":36.1,"p90":57.1,"cs":34.31,"vs":72.71},{"n":"Camden Heide","t":"Purdue","s":2,"r":"West","ppg":10.0,"ev":35.9,"p90":55.3,"cs":34.46,"vs":67.17},{"n":"Johnell Davis","t":"Arkansas","s":4,"r":"West","ppg":13.0,"ev":36.1,"p90":56.2,"cs":34.34,"vs":78.26},{"n":"Braylon Mullins","t":"UConn","s":2,"r":"East","ppg":10.0,"ev":32.6,"p90":51.9,"cs":30.88,"vs":68.33},{"n":"Thijs De Ridder","t":"Virginia","s":3,"r":"Midwest","ppg":12.0,"ev":34.8,"p90":54.2,"cs":32.9,"vs":74.71},{"n":"Robert Wright III","t":"BYU","s":6,"r":"West","ppg":16.0,"ev":32.4,"p90":51.7,"cs":30.94,"vs":83.78}];

const PSET = new Set(P.map(x => x.n));
const NAMES = { cole: "Cole", chris: "Chris", lee: "Lee", hunter: "Hunter", eric: "Eric" };
const ALL_D = ["cole", "chris", "lee", "hunter", "eric"];
const OUR = new Set(["cole", "chris"]);
const CLR = { cole: "#3b82f6", chris: "#a78bfa", lee: "#a1a1aa", hunter: "#a1a1aa", eric: "#a1a1aa" };
const RBG = { East: "#1e293b", West: "#2a1f14", Midwest: "#0f2922", South: "#2a1215" };
const INJ = new Set(["Nate Ament", "Braden Huff", "Patrick Ngongba II"]);
const GPT = new Set(["Cameron Boozer","Thomas Haugh","Brayden Burries","Kingston Flemings","Darius Acuff Jr","Milan Momcilovic","Joshua Jefferson","Alex Condon","Isaiah Evans","Yaxel Lendeborg","Emanuel Sharp","Koa Peat","Jaden Bradley","Braden Smith","Graham Ike","Morez Johnson Jr","Fletcher Loyer","Zuby Ejiofor","Trey Kaufman-Renn","Labaron Philon Jr","Patrick Ngongba II","Tamin Lipsey","Braden Huff","Boogie Fland","Xaivian Lee","Tarris Reed Jr","Rueben Chinyelu","Motiejus Krivas","Milos Uzan","Solo Ball","Thijs De Ridder","Aday Mara","Elliot Cadeau","Alex Karaban","Trey McKenney","Tobe Awaka","Curtis Jones","Roddy Gayle Jr","Adou Thiero","Johnell Davis","Nolan Hickman","Kasparas Jakucionis","Tomislav Ivisic","Camden Heide","Silas Demary Jr","Braylon Mullins","Connor Essegian","Kylan Boswell","Dame Sarr"]);

const API = import.meta.env.VITE_API_URL || "";
const HEADERS = { "Content-Type": "application/json" };
const DEFAULT_STATE = {
  picks: {},
  cu: "cole",
  seats: { hunter: 1, cole: 2, eric: 3, chris: 4, lee: 5 },
};

function calcAdj(p, bt, myP, partP) {
  const base = bt === "chalk" ? p.cs : p.vs;
  let m = 1;
  const mi = myP.map(n => P.find(x => x.n === n)).filter(Boolean);
  const pa = partP.map(n => P.find(x => x.n === n)).filter(Boolean);
  const mt = mi.filter(x => x.t === p.t).length;
  if (mt >= 2) m *= .12; else if (mt === 1) m *= .5;
  const mr = mi.filter(x => x.r === p.r).length;
  if (mr >= 4) m *= .65; else if (mr >= 3) m *= .82;
  const pt = pa.filter(x => x.t === p.t).length;
  if (pt >= 2) m *= .55; else if (pt === 1) m *= .78;
  const pr = pa.filter(x => x.r === p.r).length;
  if (pr >= 3) m *= .88;
  return base * m;
}

function buildSnake(seatMap) {
  const s2d = {}; Object.entries(seatMap).forEach(([n, s]) => { s2d[s] = n; });
  const order = [];
  for (let rd = 1; rd <= 10; rd++) {
    const seats = rd % 2 === 1 ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];
    seats.forEach(s => { order.push(s2d[s]); });
  }
  return order;
}

// ── Sync hook — SSE real-time push with polling fallback ──
function useSync() {
  const [st, setSt] = useState({ ...DEFAULT_STATE });
  const lw = useRef(0);
  const [syncError, setSyncError] = useState(false);
  const [lastAction, setLastAction] = useState(null); // { player, drafter, ts } for flash
  const sseRef = useRef(null);

  // SSE connection for real-time push
  useEffect(() => {
    let es;
    let retryTimeout;
    let errorBannerTimeout;
    function connect() {
      es = new EventSource(`${API}/events`);
      sseRef.current = es;
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          // Only apply SSE updates if we haven't written recently (avoid echo)
          if (Date.now() - lw.current > 300) {
            setSt(data);
          }
          setSyncError(false);
          clearTimeout(errorBannerTimeout);
        } catch {}
      };
      es.onerror = () => {
        es.close();
        // Only show error banner if reconnect hasn't succeeded within 8s
        clearTimeout(errorBannerTimeout);
        errorBannerTimeout = setTimeout(() => setSyncError(true), 8000);
        // Retry SSE connection after 3s
        retryTimeout = setTimeout(connect, 3000);
      };
    }
    connect();
    return () => {
      if (es) es.close();
      clearTimeout(retryTimeout);
      clearTimeout(errorBannerTimeout);
    };
  }, []);

  // Polling fallback — only fires if SSE is down (checks every 5s)
  useEffect(() => {
    const id = setInterval(async () => {
      if (sseRef.current?.readyState === EventSource.OPEN) return;
      if (Date.now() - lw.current < 2000) return;
      try {
        const r = await fetch(`${API}/state`);
        if (r.ok) {
          setSt(await r.json());
          setSyncError(false);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const postAction = useCallback(async (endpoint, body) => {
    lw.current = Date.now();
    try {
      const r = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const ct = r.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          setSt(await r.json());
        }
        setSyncError(false);
      } else {
        setSyncError(true);
      }
    } catch {
      setSyncError(true);
    }
  }, []);

  const pick = useCallback((player, drafter) => {
    setSt(prev => ({ ...prev, picks: { ...prev.picks, [player]: drafter } }));
    setLastAction({ player, drafter, ts: Date.now() });
    postAction("/pick", { player, drafter });
  }, [postAction]);

  const unpick = useCallback((player) => {
    setSt(prev => {
      const p = { ...prev.picks };
      delete p[player];
      return { ...prev, picks: p };
    });
    setLastAction(null);
    postAction("/unpick", { player });
  }, [postAction]);

  const updateSettings = useCallback((settings) => {
    setSt(prev => ({
      ...prev,
      ...(settings.cu !== undefined ? { cu: settings.cu } : {}),
      ...(settings.seats ? { seats: { ...prev.seats, ...settings.seats } } : {}),
    }));
    postAction("/settings", settings);
  }, [postAction]);

  const reset = useCallback(async () => {
    const newState = { ...DEFAULT_STATE };
    setSt(newState);
    setLastAction(null);
    lw.current = Date.now();
    try {
      const r = await fetch(`${API}/state`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(newState),
      });
      if (r.ok) setSyncError(false);
    } catch {
      setSyncError(true);
    }
  }, []);

  return { st, pick, unpick, updateSettings, reset, syncError, lastAction };
}

function RosterPanel({ picks, onReassign, onRemove }) {
  const rosters = {}; ALL_D.forEach(d => { rosters[d] = []; });
  Object.entries(picks).forEach(([n, d]) => { if (rosters[d]) rosters[d].push(n); });
  return (
    <div style={{ marginTop: 6, border: "1px solid #2a2d3a", borderRadius: 4, padding: 6, fontSize: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
        {ALL_D.map(d => (
          <div key={d} style={{ background: OUR.has(d) ? CLR[d] + "15" : "#1a1d27", borderRadius: 3, padding: 3, border: `1px solid ${OUR.has(d) ? CLR[d] + "30" : "#2a2d3a"}` }}>
            <div style={{ fontWeight: 700, color: CLR[d], fontSize: 10, marginBottom: 2 }}>{NAMES[d]} ({rosters[d].length})</div>
            {rosters[d].map(name => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1px 0", borderBottom: "1px solid #2a2d3a" }}>
                <span style={{ fontSize: 9, color: "#e4e4e7" }}>{name}{!PSET.has(name) && <span style={{ color: "#f59e0b" }}> *</span>}</span>
                <span style={{ display: "flex", gap: 1 }}>
                  <select aria-label={`Reassign ${name}`} value={d} onChange={e => onReassign(name, e.target.value)} style={{ fontSize: 8, border: "1px solid #2a2d3a", borderRadius: 2, width: 44, background: "#13151d", color: "#e4e4e7" }}>
                    {ALL_D.map(dd => <option key={dd} value={dd}>{NAMES[dd]}</option>)}
                  </select>
                  <button aria-label={`Remove ${name}`} onClick={() => onRemove(name)} style={{ fontSize: 8, padding: "0 2px", background: "#3b1117", border: "1px solid #7f1d1d", borderRadius: 2, cursor: "pointer", color: "#fca5a5" }}>✕</button>
                </span>
              </div>
            ))}
            {!rosters[d].length && <div style={{ color: "#52525b", fontSize: 9 }}>—</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function UnlistedInput({ onAdd }) {
  const [name, setName] = useState("");
  const [drafter, setDrafter] = useState("lee");
  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, drafter);
    setName("");
  };
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      <span style={{ fontSize: 10, color: "#71717a", whiteSpace: "nowrap" }}>Unlisted pick:</span>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
        placeholder="Player name"
        aria-label="Unlisted player name"
        style={{ fontSize: 11, padding: "3px 6px", border: "1px solid #2a2d3a", borderRadius: 4, width: 140, background: "#13151d", color: "#e4e4e7" }}
      />
      <select aria-label="Drafter for unlisted player" value={drafter} onChange={e => setDrafter(e.target.value)} style={{ fontSize: 10, padding: "2px 4px", border: "1px solid #2a2d3a", borderRadius: 4, background: "#13151d", color: "#e4e4e7" }}>
        {ALL_D.map(d => <option key={d} value={d}>{NAMES[d]}</option>)}
      </select>
      <button onClick={handleAdd} style={{ fontSize: 10, padding: "3px 8px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>Add</button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const { st, pick, unpick, updateSettings, reset, syncError, lastAction } = useSync();
  const [blindOnly, setBlindOnly] = useState(false);
  const [showRosters, setShowRosters] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const tableRef = useRef(null);
  const scrollRef = useRef(0);
  const { picks, cu: chalkUser, seats } = st;

  // Scroll preservation
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

  const draft = useCallback((n, d) => { if (picks[n]) return; pick(n, d); }, [pick, picks]);
  const undraft = useCallback(n => unpick(n), [unpick]);
  const reassign = useCallback((n, d) => pick(n, d), [pick]);
  const setChalk = useCallback(u => updateSettings({ cu: u }), [updateSettings]);
  const doReset = useCallback(() => { reset(); setConfirmReset(false); }, [reset]);

  const coleP = useMemo(() => Object.entries(picks).filter(([, d]) => d === "cole").map(([n]) => n), [picks]);
  const chrisP = useMemo(() => Object.entries(picks).filter(([, d]) => d === "chris").map(([n]) => n), [picks]);
  const myBoard = user === chalkUser ? "chalk" : "variance";
  const myPicks = user === "cole" ? coleP : chrisP;
  const partPicks = user === "cole" ? chrisP : coleP;

  const allSeatsSet = ALL_D.every(d => seats[d]);
  const allSeatsUnique = allSeatsSet && new Set(Object.values(seats)).size === 5;
  const snakeOrder = useMemo(() => (allSeatsSet && allSeatsUnique) ? buildSnake(seats) : [], [seats, allSeatsSet, allSeatsUnique]);
  const totalPicked = Object.keys(picks).length;
  const draftComplete = totalPicked >= 50;
  const currentDrafter = snakeOrder.length > 0 && !draftComplete ? snakeOrder[totalPicked] : null;
  const isMyTurn = currentDrafter === user;

  // Flash highlight for most recent pick (fades after 2s)
  const [flashPlayer, setFlashPlayer] = useState(null);
  useEffect(() => {
    if (!lastAction) return;
    setFlashPlayer(lastAction.player);
    const t = setTimeout(() => setFlashPlayer(null), 2000);
    return () => clearTimeout(t);
  }, [lastAction]);

  const ranked = useMemo(() => {
    if (!user) return [];
    return P.map(p => ({
      ...p,
      adj: calcAdj(p, myBoard, myPicks, partPicks),
      drafted: picks[p.n] || null,
      blind: !GPT.has(p.n),
    }))
    .filter(p => !blindOnly || p.blind)
    .sort((a, b) => {
      // All drafted players sink to bottom; opponents below ours
      const aD = !!a.drafted, bD = !!b.drafted;
      if (aD !== bD) return aD ? 1 : -1;
      if (aD && bD) {
        const aO = !OUR.has(a.drafted), bO = !OUR.has(b.drafted);
        if (aO !== bO) return aO ? 1 : -1;
      }
      return b.adj - a.adj;
    });
  }, [user, myBoard, myPicks, partPicks, picks, blindOnly]);

  const sm = names => {
    const ps = names.map(n => P.find(x => x.n === n)).filter(Boolean);
    const rg = {}; ps.forEach(p => { rg[p.r] = (rg[p.r] || 0) + 1; });
    return { n: names.length, ev: Math.round(ps.reduce((s, p) => s + p.ev, 0)), blind: ps.filter(p => !GPT.has(p.n)).length, rg };
  };
  const cs = sm(coleP), chs = sm(chrisP);

  if (!user) return (
    <div style={{ fontFamily: "Inter,-apple-system,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 12, background: "#0f1117", color: "#e4e4e7" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5, margin: 0 }}>Draft HQ</h1>
      <p style={{ fontSize: 12, color: "#71717a", margin: 0 }}>Syncs live between devices</p>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {[["cole", "Cole", "#3b82f6"], ["chris", "Chris", "#a78bfa"]].map(([id, l, bg]) => (
          <button key={id} onClick={() => setUser(id)} style={{ padding: "16px 44px", fontSize: 17, fontWeight: 700, cursor: "pointer", borderRadius: 10, background: bg, color: "#fff", border: "none", boxShadow: "0 2px 12px " + bg + "55" }}>{l}</button>
        ))}
      </div>
    </div>
  );

  const bc = myBoard === "chalk" ? "#1e40af" : "#7c3aed";

  return (
    <div style={{ fontFamily: "Inter,-apple-system,sans-serif", maxWidth: 960, margin: "0 auto", padding: "4px 6px", fontSize: 12, background: "#0f1117", color: "#e4e4e7", minHeight: "100vh" }}>
      {/* Sync error banner */}
      {syncError && (
        <div role="alert" style={{
          background: "#3b1117", color: "#fca5a5", textAlign: "center",
          padding: "4px 0", fontSize: 11, fontWeight: 700,
          border: "1px solid #7f1d1d", borderRadius: 4, marginBottom: 4,
        }}>
          ⚠ Sync error — check your connection. Picks may not be saving.
        </div>
      )}

      {/* Turn banner */}
      {draftComplete ? (
        <div role="status" style={{
          textAlign: "center", padding: "8px 0", marginBottom: 4, borderRadius: 6, fontSize: 16, fontWeight: 800,
          background: "#052e16", color: "#4ade80", border: "2px solid #166534"
        }}>
          DRAFT COMPLETE — 50/50 picks
        </div>
      ) : currentDrafter && (
        <div role="status" style={{
          textAlign: "center", padding: "6px 0", marginBottom: 4, borderRadius: 6, fontSize: 14, fontWeight: 800,
          background: isMyTurn ? "#052e16" : OUR.has(currentDrafter) ? CLR[currentDrafter] + "20" : "#1a1d27",
          color: isMyTurn ? "#4ade80" : OUR.has(currentDrafter) ? CLR[currentDrafter] : "#71717a",
          border: isMyTurn ? "2px solid #166534" : "1px solid #2a2d3a"
        }}>
          {isMyTurn ? `YOUR PICK (#${totalPicked + 1})` : `${NAMES[currentDrafter]}'s pick (#${totalPicked + 1})`}
        </div>
      )}

      {/* Config bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#e4e4e7" }}>Draft HQ</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: bc, background: bc + "25", padding: "2px 8px", borderRadius: 4 }}>
            {NAMES[user]} / {myBoard.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap", fontSize: 10 }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 2, color: "#a1a1aa" }}>
            <input type="checkbox" checked={blindOnly} onChange={e => setBlindOnly(e.target.checked)} style={{ width: 11, height: 11 }} />Blind only
          </label>
          <span style={{ color: "#3f3f46" }}>·</span>
          <span style={{ color: "#71717a" }}>Chalk:</span>
          {["cole", "chris"].map(u => <button key={u} onClick={() => setChalk(u)} aria-label={`Set chalk to ${NAMES[u]}`} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, cursor: "pointer", fontWeight: chalkUser === u ? 800 : 400, background: chalkUser === u ? CLR[u] : "#1a1d27", color: chalkUser === u ? "#fff" : "#71717a", border: "1px solid " + (chalkUser === u ? CLR[u] : "#2a2d3a") }}>{NAMES[u]}</button>)}
          <span style={{ color: "#3f3f46" }}>·</span>
          <span style={{ color: "#71717a" }}>Order: Hunter→Cole→Eric→Chris→Lee</span>
          <span style={{ color: "#3f3f46" }}>·</span>
          {!confirmReset
            ? <button onClick={() => setConfirmReset(true)} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 3, cursor: "pointer", background: "#3b1117", color: "#fca5a5", border: "1px solid #7f1d1d" }}>Reset</button>
            : <>
                <button onClick={doReset} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, cursor: "pointer", background: "#dc2626", color: "#fff", border: "none", fontWeight: 700 }}>Yes, reset</button>
                <button onClick={() => setConfirmReset(false)} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, cursor: "pointer", background: "#1a1d27", color: "#a1a1aa", border: "1px solid #2a2d3a" }}>Cancel</button>
              </>
          }
        </div>
      </div>

      {/* Roster summaries */}
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[["Cole", coleP, cs, "cole"], ["Chris", chrisP, chs, "chris"]].map(([l, pks, s, id]) => (
          <div key={id} style={{ flex: 1, background: id === user ? CLR[id] + "15" : "#1a1d27", borderRadius: 4, padding: "3px 5px", border: id === user ? `2px solid ${CLR[id]}30` : "1px solid #2a2d3a" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <strong style={{ color: CLR[id] }}>{l} ({s.n}/10) {id === chalkUser ? "CHALK" : "VAR"}</strong>
              <span style={{ color: "#a1a1aa" }}>E[pts] {s.ev}</span>
            </div>
            <div style={{ fontSize: 10, color: "#a1a1aa", marginTop: 1 }}>{pks.map(n => { const p = P.find(x => x.n === n); return p ? p.n.split(' ').pop() : n; }).join(', ') || '—'}</div>
            <div style={{ color: "#52525b", fontSize: 9, marginTop: 1 }}>
              Blind:{s.blind} | {Object.entries(s.rg).map(([r, c]) => `${r[0]}${c}`).join(' ') || 'none'}
            </div>
          </div>
        ))}
      </div>

      {/* Unlisted player input */}
      <UnlistedInput onAdd={draft} />

      {/* Draft board */}
      <div ref={tableRef} style={{ overflowX: "auto", maxHeight: "52vh", overflowY: "auto", border: "1px solid #2a2d3a", borderRadius: 4 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
            <tr style={{ background: bc, color: "#fff", fontSize: 10 }}>
              {["#", "Player", "Team", "Sd", "Rgn", "PPG", "EV", "P90", "Adj", ""].map((h, i) => (
                <th key={i} scope="col" style={{ padding: "4px 3px", textAlign: i === 1 || i === 2 ? "left" : "center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((p, i) => {
              const d = p.drafted, isOur = OUR.has(d), isOpp = d && !isOur;
              const isFlash = flashPlayer === p.n;
              const bg = isFlash ? "#3b3510" : INJ.has(p.n) && !d ? "#3b1117" : d ? (isOur ? CLR[d] + "18" : "#18181b") : (i < 5 && !d ? "#1c1c10" : i % 2 === 0 ? "#13151d" : "#1a1d27");
              return (
                <tr key={p.n} style={{ background: bg, opacity: isOpp ? .35 : 1, transition: "background-color 0.5s ease" }}>
                  <td style={{ padding: "3px 3px", textAlign: "center", fontWeight: i < 5 && !d ? 700 : 400, fontSize: 11, minWidth: 22, color: "#a1a1aa" }}>{d ? "—" : i + 1}</td>
                  <td style={{ padding: "3px 4px", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", color: "#e4e4e7" }}>
                    {isOpp ? <s style={{ color: "#52525b" }}>{p.n}</s> : p.n}
                    {p.blind && <span style={{ display: "inline-block", fontSize: 7, fontWeight: 800, padding: "0 3px", borderRadius: 2, background: "#059669", color: "#fff", marginLeft: 3, verticalAlign: "middle" }}>B</span>}
                    {INJ.has(p.n) && <span style={{ display: "inline-block", fontSize: 7, fontWeight: 800, padding: "0 3px", borderRadius: 2, background: "#dc2626", color: "#fff", marginLeft: 2, verticalAlign: "middle" }}>INJ?</span>}
                  </td>
                  <td style={{ padding: "3px 3px", fontSize: 11, color: "#71717a" }}>{p.t}</td>
                  <td style={{ padding: "3px 2px", textAlign: "center", fontSize: 10, color: "#a1a1aa" }}>{p.s}</td>
                  <td style={{ padding: "3px 2px", textAlign: "center", background: RBG[p.r], fontSize: 10, fontWeight: 600, borderRadius: 2, color: "#e4e4e7" }}>{p.r[0]}</td>
                  <td style={{ padding: "3px 2px", textAlign: "center", fontWeight: 700, color: "#e4e4e7" }}>{p.ppg}</td>
                  <td style={{ padding: "3px 2px", textAlign: "center", color: "#a1a1aa" }}>{p.ev.toFixed(0)}</td>
                  <td style={{ padding: "3px 2px", textAlign: "center", color: "#a1a1aa" }}>{p.p90.toFixed(0)}</td>
                  <td style={{ padding: "3px 2px", textAlign: "center", fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#e4e4e7" }}>{d ? "—" : p.adj.toFixed(1)}</td>
                  <td style={{ padding: "2px 3px", whiteSpace: "nowrap" }}>
                    {d ? (
                      <span style={{ display: "flex", gap: 2, alignItems: "center" }}>
                        <select aria-label={`Reassign ${p.n}`} value={d} onChange={e => reassign(p.n, e.target.value)} style={{ fontSize: 10, padding: "2px 2px", border: "1px solid #2a2d3a", borderRadius: 3, width: 64, color: CLR[d], fontWeight: 600, background: "#13151d" }}>
                          {ALL_D.map(dd => <option key={dd} value={dd}>{NAMES[dd]}</option>)}
                        </select>
                        <button aria-label={`Undraft ${p.n}`} onClick={() => undraft(p.n)} style={{ fontSize: 10, padding: "2px 5px", cursor: "pointer", background: "#3b1117", border: "1px solid #7f1d1d", borderRadius: 3, color: "#fca5a5" }}>✕</button>
                      </span>
                    ) : (
                      <span style={{ display: "flex", gap: 3 }}>
                        {ALL_D.map(dr => (
                          <button key={dr} aria-label={`Draft ${p.n} for ${NAMES[dr]}`} onClick={() => draft(p.n, dr)} style={{
                            fontSize: dr === user ? 13 : 10,
                            padding: dr === user ? "6px 14px" : "4px 8px",
                            minWidth: dr === user ? 44 : 36,
                            cursor: "pointer", borderRadius: 4,
                            background: dr === user ? CLR[dr] : OUR.has(dr) ? CLR[dr] + "30" : "#2a2d3a",
                            color: dr === user ? "#fff" : OUR.has(dr) ? CLR[dr] : "#71717a",
                            border: "none",
                            fontWeight: dr === user ? 700 : OUR.has(dr) ? 600 : 400,
                          }}>{NAMES[dr]}</button>
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
      <button onClick={() => setShowRosters(!showRosters)} style={{ marginTop: 5, fontSize: 10, padding: "3px 10px", cursor: "pointer", borderRadius: 3, background: showRosters ? "#3b82f6" : "#1a1d27", color: showRosters ? "#fff" : "#a1a1aa", border: "1px solid " + (showRosters ? "#3b82f6" : "#2a2d3a") }}>
        {showRosters ? "Hide" : "Show"} All Rosters ({totalPicked} picks)
      </button>
      {showRosters && <RosterPanel picks={picks} onReassign={reassign} onRemove={undraft} />}

      <div style={{ marginTop: 4, fontSize: 9, color: "#52525b" }}>
        <b style={{ color: "#059669" }}>B</b> = blind to opponents · <b style={{ color: "#dc2626" }}>INJ?</b> = injury concern · Adj = score w/ team/region/partner penalties · Syncs in real-time · * = unlisted player
      </div>
    </div>
  );
}
