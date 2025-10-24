// src/hooks/useApi.js
import { useCallback, useEffect, useRef, useState } from "react";
import { postCommand, getStatus, getLastImage } from "../services/api.js";
import { connectSSE } from "../services/sse.js";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function useApi() {
  const robotId = "R1"; // o traelo de contexto/props
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
    } catch {}
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
  // ✅ API de comandos (nuevo formato commandType / content)
  // ===========================================================

  // Movimiento
  const moveForward  = () => postCommand({ robotId, commandType: "move", content: { direction: "forward" } });
  const moveBackward = () => postCommand({ robotId, commandType: "move", content: { direction: "backward" } });
  const turnLeft     = () => postCommand({ robotId, commandType: "turn", content: { direction: "left" } });
  const turnRight    = () => postCommand({ robotId, commandType: "turn", content: { direction: "right" } });
  const stop         = () => postCommand({ robotId, commandType: "stop" });

  // Torre
  const liftUp       = () => postCommand({ robotId, commandType: "lift", content: { direction: "up" } });
  const liftDown     = () => postCommand({ robotId, commandType: "lift", content: { direction: "down" } });
  const tiltUp       = () => postCommand({ robotId, commandType: "tilt", content: { direction: "up" } });
  const tiltDown     = () => postCommand({ robotId, commandType: "tilt", content: { direction: "down" } });

  // Modo + auto
  const setMode      = (mode) => postCommand({ robotId, commandType: "mode", content: { mode } });
  const startAuto    = () => postCommand({ robotId, commandType: "start" });
  const stopAll      = () => postCommand({ robotId, commandType: "stop" });

  // Foto
  const takePhoto    = () => postCommand({ robotId, commandType: "take_photo" });

  // ===========================================================

  return {
    connected, latencyMs, telemetry, snapshot, logs,
    // comandos
    moveForward, moveBackward, turnLeft, turnRight, stop,
    liftUp, liftDown, tiltUp, tiltDown,
    setMode, startAuto, stopAll, takePhoto,
  };
}
