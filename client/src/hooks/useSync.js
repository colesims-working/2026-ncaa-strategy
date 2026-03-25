import { useState, useEffect, useCallback, useRef } from "react";
import {
  API_BASE,
  JSON_HEADERS,
  DEFAULT_STATE,
  SSE_ECHO_GUARD_MS,
  SSE_RECONNECT_MS,
  SSE_ERROR_BANNER_DELAY_MS,
  POLL_INTERVAL_MS,
  POLL_WRITE_COOLDOWN_MS,
} from "../data/constants.js";

/**
 * Real-time sync hook — SSE push with polling fallback.
 * Returns draft state and action dispatchers.
 */
export default function useSync() {
  const [draftState, setDraftState] = useState({ ...DEFAULT_STATE });
  const lastWriteTime = useRef(0);
  const [syncError, setSyncError] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const sseRef = useRef(null);

  // SSE connection for real-time push
  useEffect(() => {
    let eventSource;
    let retryTimeout;
    let errorBannerTimeout;

    function connect() {
      eventSource = new EventSource(`${API_BASE}/events`);
      sseRef.current = eventSource;

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (Date.now() - lastWriteTime.current > SSE_ECHO_GUARD_MS) {
            setDraftState(data);
          }
          setSyncError(false);
          clearTimeout(errorBannerTimeout);
        } catch {}
      };

      eventSource.onerror = () => {
        eventSource.close();
        clearTimeout(errorBannerTimeout);
        errorBannerTimeout = setTimeout(() => setSyncError(true), SSE_ERROR_BANNER_DELAY_MS);
        retryTimeout = setTimeout(connect, SSE_RECONNECT_MS);
      };
    }

    connect();
    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(retryTimeout);
      clearTimeout(errorBannerTimeout);
    };
  }, []);

  // Polling fallback — only fires if SSE is down
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (sseRef.current?.readyState === EventSource.OPEN) return;
      if (Date.now() - lastWriteTime.current < POLL_WRITE_COOLDOWN_MS) return;
      try {
        const response = await fetch(`${API_BASE}/state`);
        if (response.ok) {
          setDraftState(await response.json());
          setSyncError(false);
        }
      } catch {}
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const postAction = useCallback(async (endpoint, body) => {
    lastWriteTime.current = Date.now();
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          setDraftState(await response.json());
        }
        setSyncError(false);
      } else {
        setSyncError(true);
      }
    } catch {
      setSyncError(true);
    }
  }, []);

  const pick = useCallback(
    (player, drafter) => {
      setDraftState((prev) => ({ ...prev, picks: { ...prev.picks, [player]: drafter } }));
      setLastAction({ player, drafter, ts: Date.now() });
      postAction("/pick", { player, drafter });
    },
    [postAction],
  );

  const unpick = useCallback(
    (player) => {
      setDraftState((prev) => {
        const picks = { ...prev.picks };
        delete picks[player];
        return { ...prev, picks };
      });
      setLastAction(null);
      postAction("/unpick", { player });
    },
    [postAction],
  );

  const updateSettings = useCallback(
    (settings) => {
      setDraftState((prev) => ({
        ...prev,
        ...(settings.chalkUser !== undefined ? { chalkUser: settings.chalkUser } : {}),
        ...(settings.seats ? { seats: { ...prev.seats, ...settings.seats } } : {}),
      }));
      postAction("/settings", settings);
    },
    [postAction],
  );

  const reset = useCallback(async () => {
    const newState = { ...DEFAULT_STATE };
    setDraftState(newState);
    setLastAction(null);
    lastWriteTime.current = Date.now();
    try {
      const response = await fetch(`${API_BASE}/state`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(newState),
      });
      if (response.ok) setSyncError(false);
    } catch {
      setSyncError(true);
    }
  }, []);

  return { draftState, pick, unpick, updateSettings, reset, syncError, lastAction };
}
