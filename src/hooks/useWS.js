// src/hooks/useWS.js
import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL  = import.meta.env.VITE_WS_URL;           // ej: ws://localhost:3000/ws
const API_URL = import.meta.env.VITE_API_URL || "";    // ej: http://localhost:3000

export default function useWS() {
  // --- refs & estado ---
  const wsRef    = useRef(null);
  const hbRef    = useRef(null);
  const retryRef = useRef(0);
  const stopped  = useRef(false);

  const [connected, setConnected]   = useState(false);
  const [latencyMs, setLatencyMs]   = useState(null);

  // Telemetría/vision tal como la UI la consume
  const [telemetry, setTelemetry] = useState(null);      // {battery, status, mode, mast, power, ...}
  const [snapshot,  setSnapshot]  = useState(null);      // {snapshotUrl|url, ts, boxes?}
  const [steps,     setSteps]     = useState([]);        // (lo mantenemos por compat)

  // --- util: cerrar socket de forma segura ---
  const safeClose = useCallback((reason) => {
    const s = wsRef.current;
    if (!s) return;
    if (s.readyState === WebSocket.CLOSING || s.readyState === WebSocket.CLOSED) return;
    try { s.close(); } catch (e) { /* no-op */ }
    // console.debug("[WS] closed", reason || "");
  }, []);

  // --- util: enviar JSON si el socket está abierto ---
  const _send = useCallback((obj) => {
    const s = wsRef.current;
    if (!s || s.readyState !== WebSocket.OPEN) return;
    try { s.send(JSON.stringify(obj)); } catch (e) { /* no-op */ }
  }, []);

  // === API para la UI ===

  // 1) Mandar un comando discreto (movimiento, power, etc.)
  //    Ej: sendControl("move_forward", { value: 20 }, "R1")
  const sendControl = useCallback((task, args = {}, robotId) => {
    // compat con el server que lee "value" toplevel
    const payload = {
      type:   "command",
      source: "web_ui",
      robotId,
      task,
      // si te pasan {value: 10} en args, lo exponemos también a toplevel
      ...(typeof args?.value !== "undefined" ? { value: args.value } : {}),
      // y mandamos el objeto entero por si el backend lo usa
      args
    };
    _send(payload);
  }, [_send]);

  // 2) Cambiar modo (manda dos variantes por compatibilidad de server anteriores)
  const setMode = useCallback((value, robotId) => {
    // variante nueva: un command explícito
    sendControl("change_mode", { value }, robotId);
    // variante vieja: algunos servers escuchaban {type:"mode", value}
    _send({ type: "mode", robotId, value });
  }, [sendControl, _send]);

  // 3) Pedir captura al robot (si tu backend/robot la soporta)
  const captureImage = useCallback((robotId) => {
    sendControl("capture_image", {}, robotId);
  }, [sendControl]);

  // 4) Subir imagen a la API (flujo Tomás – IA/QR/R2). FormData multipart.
  //    file: un File (input type="file" o canvas blob)
  //    endpoint por defecto: /api/images/analyze (análisis completo)
  const uploadImage = useCallback(async (file, endpoint = "/api/images/analyze") => {
    if (!API_URL) throw new Error("Falta VITE_API_URL en .env");
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(`Upload fail (${res.status})`);
    return res.json();
  }, []);

  // === Conexión WS con reconexión & heartbeat ===
  useEffect(() => {
    stopped.current = false;

    function connect() {
      if (stopped.current) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setConnected(true);
        retryRef.current = 0;

        // heartbeat cada 10s
        hbRef.current = setInterval(() => {
          const t0 = Date.now();
          try {
            ws.send(JSON.stringify({ type: "ping", t0 }));
          } catch (e) {
            safeClose("ping send failed");
          }
        }, 10000);
      });

      ws.addEventListener("message", (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }

        switch (msg.type) {
          // compat con nuestro backend de ejemplo:
          case "pong":
            if (msg.t0) setLatencyMs(Date.now() - msg.t0);
            break;

          // el server que puentea MQTT → WS manda esto
          case "robot_status":
            // ejemplo de estado del simulador:
            // {battery, status, mode, mast, power, timestamp, ...}
            setTelemetry((prev) => ({ ...(prev || {}), ...msg }));
            break;

          // algunos backends envían "telemetry" como nombre
          case "telemetry":
            setTelemetry((prev) => ({ ...(prev || {}), ...msg }));
            break;

          // visión/capturas
          case "vision":
          case "snapshot":
            setSnapshot({
              snapshotUrl: msg.snapshotUrl || msg.url || null,
              ts: msg.ts || Date.now(),
              boxes: msg.boxes || null
            });
            break;

          // listado de pasos (si más adelante lo vuelven a usar)
          case "steps":
            setSteps(Array.isArray(msg.items) ? msg.items : []);
            break;

          case "ack":
            // opcional: mostrar toast / feedback
            break;

          default:
            // console.debug("[WS] msg", msg);
            break;
        }
      });

      ws.addEventListener("error", (ev) => {
        // console.error("[WS] error", ev);
        safeClose("onerror");
      });

      ws.addEventListener("close", () => {
        setConnected(false);
        if (hbRef.current) {
          clearInterval(hbRef.current);
          hbRef.current = null;
        }
        if (!stopped.current) {
          // backoff exponencial + jitter
          const tries = Math.min(retryRef.current + 1, 6);
          retryRef.current = tries;
          const delay = Math.pow(2, tries) * 500 + Math.random() * 300;
          setTimeout(connect, delay);
        }
      });
    }

    connect();

    return () => {
      stopped.current = true;
      if (hbRef.current) {
        clearInterval(hbRef.current);
        hbRef.current = null;
      }
      safeClose("unmount");
    };
  }, [safeClose]);

  return {
    // estado
    connected,
    latencyMs,
    telemetry,
    snapshot,
    steps,
    setSteps,

    // acciones
    sendControl,
    setMode,
    captureImage,
    uploadImage
  };
}
