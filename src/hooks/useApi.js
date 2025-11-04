// src/hooks/useApi.js
import { useCallback, useEffect, useRef, useState } from "react";
import { getStatus, getLastImage } from "../services/api.js";
import { connectSSE } from "../services/sse.js";
import {
  sendMove,
  sendTurn,
  sendLift,
  sendTilt,
  setMode as apiSetMode,
  startAuto as apiStartAuto,
  stopAll as apiStopAll,
  takePhoto as apiTakePhoto,
} from "../services/commands.js";

// ====== Config ======
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
const POLL_STATUS_MS = Number(import.meta.env.VITE_POLL_STATUS_MS ?? 3000);  // /api/status
const POLL_HEALTH_MS = Number(import.meta.env.VITE_POLL_HEALTH_MS ?? 10000); // /health

export default function useApi() {
  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [logs, setLogs] = useState([]);

  // ====== Health (estable) ======
  const measureHealth = useCallback(async () => {
    const t0 = performance.now();
    try {
      const r = await fetch(`${API_BASE}/health`, { cache: "no-store" });
      setLatencyMs(r.ok ? Math.round(performance.now() - t0) : null);
      setConnected(!!r.ok);
    } catch {
      setLatencyMs(null);
      setConnected(false);
    }
  }, []);

  // ====== Estado /status (estable) ======
  const pullStatus = useCallback(async () => {
    try {
      const data = await getStatus(); // mantengo tu service tal cual
      if (data?.robot) setTelemetry(data.robot);
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    const updateSnapshot = async () => {
      const last = await getLastImage()
      setSnapshot({ snapshotUrl: last.url, description: last.description, ts: last.timestamp || Date.now() })
    }
    updateSnapshot()
  }, [])

  // ====== SSE única + cleanup ======
  useEffect(() => {
    const disconnect = connectSSE({
      onOpen: () => setConnected(true),
      onError: () => setConnected(false),

      onTelemetry: (data) => {
        setTelemetry((prev) => ({ ...(prev || {}), ...data }));
      },

      onNewImage: async () => {
        try {
          const last = await getLastImage();
          if (last?.url) {
            setSnapshot({ snapshotUrl: last.url, description: last.description, ts: last.timestamp || Date.now() });
            setLogs((L) => [{ level: "info", msg: "Nueva imagen disponible" }, ...L].slice(0, 50));
          }
        } catch {
            setLogs((L) => [{ level: "error", msg: "Error al traer la última imagen" }, ...L].slice(0, 50));
        }
      },

      onObstacle: (payload) => {
        setLogs((L) => [{ level: "warn", msg: "Obstáculo detectado", data: payload }, ...L].slice(0, 50));
      },
    });

    return disconnect; // cleanup de la SSE
  }, []);

  // ====== Polling único + cleanup ======
  const healthTimer = useRef(null);
  const statusTimer = useRef(null);

  useEffect(() => {
    // primer “tick” inmediato
    measureHealth();
    pullStatus();

    // intervalos estables y separados
    healthTimer.current = setInterval(measureHealth, POLL_HEALTH_MS);
    statusTimer.current = setInterval(pullStatus, POLL_STATUS_MS);

    return () => {
      if (healthTimer.current) clearInterval(healthTimer.current);
      if (statusTimer.current) clearInterval(statusTimer.current);
    };
  }, [measureHealth, pullStatus]);

  // ===========================================================
  // ✅ API de comandos (con useCallback para referencias estables)
  // ===========================================================
  const moveForward  = useCallback(() => sendMove("forward"),   []);
  const moveBackward = useCallback(() => sendMove("backward"),  []);
  const turnLeft     = useCallback(() => sendTurn("left"),      []);
  const turnRight    = useCallback(() => sendTurn("right"),     []);
  const stop         = useCallback(() => apiStopAll(),          []); // alias a stopAll

  const liftUp       = useCallback(() => sendLift("up"),        []);
  const liftDown     = useCallback(() => sendLift("down"),      []);
  const tiltUp       = useCallback(() => sendTilt("up"),        []);
  const tiltDown     = useCallback(() => sendTilt("down"),      []);

  const setMode      = useCallback((mode) => apiSetMode(mode),  []); // "auto" | "manual"
  const startAuto    = useCallback(() => apiStartAuto(),        []);
  const stopAll      = useCallback(() => apiStopAll(),          []);

  const takePhoto    = useCallback(() => apiTakePhoto(),        []);

  // ===========================================================

  return {
    connected,
    latencyMs,
    telemetry,
    snapshot,
    logs,
    // comandos
    moveForward,
    moveBackward,
    turnLeft,
    turnRight,
    stop,
    liftUp,
    liftDown,
    tiltUp,
    tiltDown,
    setMode,
    startAuto,
    stopAll,
    takePhoto,
  };
}
