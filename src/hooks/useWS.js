import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = import.meta.env.VITE_WS_URL;

export default function useWS() {
  const wsRef = useRef(null);
  const hbRef = useRef(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);

  // Estado que consumen tus pantallas
  const [telemetry, setTelemetry] = useState(null);     // { status, mode, battery, mast, ... }
  const [snapshot, setSnapshot]   = useState(null);     // { url, ts, type, description }
  const [steps, setSteps]         = useState([]);       // [{ id, text, done }]

  // --- envío genérico ---
  const _send = useCallback((obj) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }, []);

  // Un solo formato de comando, alineado al esquema del equipo
  const sendCommand = useCallback(({ robotId, task, value }) => {
    const payload = { type: "command", robotId, source: "web_rc", task };
    if (value !== undefined) payload.value = value;
    _send(payload);
  }, [_send]);

  // Helpers de más alto nivel que usa tu UI
  const sendControl = useCallback((task, params = {}, robotId) => {
    // task: move_forward|move_backward|turn_left|turn_right|turn_degrees|stop|lift_up|lift_down|lift_stop
    // params.value (opcional): p. ej. cm o grados
    sendCommand({ robotId, task, value: params.value });
  }, [sendCommand]);

  const setMode = useCallback((value, robotId) => {
    // value: "auto" | "manual"
    sendCommand({ robotId, task: "change_mode", value });
  }, [sendCommand]);

  const requestPhoto = useCallback((robotId) => {
    sendCommand({ robotId, task: "capture_image" });
  }, [sendCommand]);

  // --- ciclo de vida WS ---
  useEffect(() => {
    async function open() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryRef.current = 0;
        // heartbeat/ping cada 10s
        hbRef.current = setInterval(() => {
          const t0 = Date.now();
          _send({ type: "ping", t0 });
        }, 10000);
      };

      ws.onmessage = (ev) => {
        let msg; try { msg = JSON.parse(ev.data); } catch { return; }

        switch (msg.type) {
          case "pong":
            if (msg.t0) setLatencyMs(Date.now() - msg.t0);
            break;

          // Telemetría del robot (nuevo nombre)
          case "robot_status":
            // msg: { type, robotId, status, mode, battery, mast, camera, ultrasonic, currentTask, timestamp, ... }
            setTelemetry(msg);
            break;

          // Compatibilidad por si todavía envían "telemetry"
          case "telemetry":
            setTelemetry(msg);
            break;

          // Nueva imagen según el esquema (images)
          case "image":
            // msg: { type:"image", robotId, url, timestamp, imageType, description }
            setSnapshot({ url: msg.url, ts: msg.timestamp, type: msg.imageType, description: msg.description });
            break;

          // Compatibilidad con el viejo evento "vision"
          case "vision":
            setSnapshot({ url: msg.snapshotUrl, ts: msg.ts, type: msg.type || "vision", description: msg.description });
            break;

          // Lista de comandos/pasos planificados o recientes
          case "commands": {
            // msg.items: [{ _id, task, value, status, timestamp }]
            const mapped = (msg.items || []).map(c => ({
              id: c._id || c.id || String(c.timestamp || Math.random()),
              text: c.value !== undefined ? `${c.task} (${c.value})` : c.task,
              done: String(c.status || "").toLowerCase().includes("done") ||
                    String(c.status || "").toLowerCase().includes("completed")
            }));
            setSteps(mapped);
            break;
          }

          // Compatibilidad si el back emite "steps"
          case "steps":
            setSteps(msg.items || []);
            break;

          case "ack":
            // TODO: mostrar toast si querés
            break;

          default: break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (hbRef.current) clearInterval(hbRef.current);
        if (!closedRef.current) {
          const tries = Math.min(retryRef.current + 1, 6);
          retryRef.current = tries;
          const delay = Math.pow(2, tries) * 500 + Math.random() * 300;
          setTimeout(open, delay);
        }
      };

      ws.onerror = () => { try { ws.close(); } catch {} };
    }

    open();
    return () => {
      closedRef.current = true;
      if (hbRef.current) clearInterval(hbRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [_send, sendCommand]);

  return {
    connected, latencyMs,
    telemetry, snapshot, steps, setSteps,
    sendControl, setMode, requestPhoto
  };
}
