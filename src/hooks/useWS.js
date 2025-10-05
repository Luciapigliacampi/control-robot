import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = import.meta.env.VITE_WS_URL;

export default function useWS() {
  const wsRef = useRef(null);
  const hbRef = useRef(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);

  const [telemetry, setTelemetry] = useState(null);  // {battery, weightKg, mode,...}
  const [snapshot, setSnapshot]   = useState(null);  // {snapshotUrl, ts, boxes?}
  const [steps, setSteps]         = useState([]);    // [{id,text,done}]

  const _send = useCallback((obj) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }, []);

  const sendControl = useCallback((cmd, args = {}, robotId) => {
    _send({ type: "control", robotId, cmd, args });
  }, [_send]);

  const setMode = useCallback((value, robotId) => {
    _send({ type: "mode", robotId, value });   // "auto" | "manual"
  }, [_send]);

  const requestPhoto = useCallback((robotId) => {
    _send({ type: "photo", robotId });
  }, [_send]);

  useEffect(() => {
    async function open() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryRef.current = 0;
        hbRef.current = setInterval(() => {
          const t0 = Date.now();
          _send({ type: "ping", t0 });
        }, 10000);
      };

      ws.onmessage = (ev) => {
        let msg; try { msg = JSON.parse(ev.data); } catch { return; }
        switch (msg.type) {
          case "pong": if (msg.t0) setLatencyMs(Date.now() - msg.t0); break;
          case "telemetry": setTelemetry(msg); break;
          case "vision": setSnapshot({ snapshotUrl: msg.snapshotUrl, ts: msg.ts, boxes: msg.boxes }); break;
          case "steps": setSteps(msg.items || []); break;
          case "ack": /* opcional: mostrar toast */ break;
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
  }, [_send]);

  return { connected, latencyMs, telemetry, snapshot, steps, setSteps, sendControl, setMode, requestPhoto };
}
