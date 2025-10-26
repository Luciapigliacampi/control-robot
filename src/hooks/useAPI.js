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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function useApi() {
  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [logs, setLogs] = useState([]);

  // --- health ping ---
  const measureHealth = useCallback(async () => {
    const t0 = Date.now();
    try {
      const r = await fetch(`${API_BASE}/health`, { cache: "no-store" });
      setLatencyMs(r.ok ? Date.now() - t0 : null);
      setConnected(r.ok);
    } catch {
      setLatencyMs(null);
      setConnected(false);
    }
  }, []);

  // --- estado /status ---
  const pullStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      if (data?.robot) setTelemetry(data.robot);
    } catch {
      // silencioso
    }
  }, []);

  // --- SSE: new_image → pedir última por HTTP; obstacle → log ---
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
            setSnapshot({ snapshotUrl: last.url, ts: last.timestamp || Date.now() });
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

    return disconnect;
  }, []);

  // --- heartbeat ---
  const intRef = useRef(null);
  useEffect(() => {
    measureHealth();
    pullStatus();
    intRef.current = setInterval(() => {
      measureHealth();
      pullStatus();
    }, 2000);
    return () => clearInterval(intRef.current);
  }, [measureHealth, pullStatus]);

  // ===========================================================
  // ✅ API de comandos (autodetección en services/commands.js)
  // ===========================================================

  // Movimiento (presionado: envía; al soltar, usar stop())
  const moveForward  = () => sendMove("forward");
  const moveBackward = () => sendMove("backward");
  const turnLeft     = () => sendTurn("left");
  const turnRight    = () => sendTurn("right");
  const stop         = () => apiStopAll(); // alias a stopAll

  // Torre e inclinación
  const liftUp   = () => sendLift("up");
  const liftDown = () => sendLift("down");
  const tiltUp   = () => sendTilt("up");
  const tiltDown = () => sendTilt("down");

  // Modo + auto
  const setMode   = (mode) => apiSetMode(mode); // "auto" | "manual"
  const startAuto = () => apiStartAuto();
  const stopAll   = () => apiStopAll();

  // Foto
  const takePhoto = () => apiTakePhoto();

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
