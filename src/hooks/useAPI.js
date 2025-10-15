// src/hooks/useApi.js
import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE;
const SSE_URL  = import.meta.env.VITE_SSE_URL;

export default function useApi() {
  const esRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);

  const [telemetry, setTelemetry] = useState(null); // {battery, mode, status, mast, power,...}
  const [snapshot, setSnapshot]   = useState(null); // { snapshotUrl, description?, ts? }

  const post = useCallback(async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  // Enviar órdenes
  const sendControl = useCallback((task, args = {}, robotId) => {
    return post("/api/commands/control", { task, args, robotId });
  }, [post]);

  // Cambiar modo (si lo decidieron usar por endpoint aparte)
  const setMode = useCallback((value, robotId) => {
    return post("/api/commands/mode", { value, robotId });
  }, [post]);

  // Tomar foto (equivalente a sendControl("capture_image"))
  const requestPhoto = useCallback((robotId) => {
    return sendControl("capture_image", {}, robotId);
  }, [sendControl]);

  // Medir latencia simple con /health
  const measureLatency = useCallback(async () => {
    const t0 = Date.now();
    try {
      await fetch(`${API_BASE}/health`, { cache: "no-store" });
      setLatencyMs(Date.now() - t0);
    } catch {
      setLatencyMs(null);
    }
  }, []);

  useEffect(() => {
    // abrir EventSource (SSE)
    const es = new EventSource(SSE_URL, { withCredentials: false });
    esRef.current = es;

    const onOpen = () => { setConnected(true); measureLatency(); };
    const onError = () => { setConnected(false); };

    const onHello = (ev) => { /* opcional: console.log('SSE hello'); */ };
    const onTelemetry = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setTelemetry(data);
        // si en el estado viene la última imagen / descripción, podés setear snapshot acá
        if (data.snapshotUrl || data.lastImageUrl) {
          setSnapshot({
            snapshotUrl: data.snapshotUrl || data.lastImageUrl,
            description: data.imageDesc || data.currentTask || null,
            ts: data.timestamp || Date.now(),
          });
        }
      } catch {}
    };

    es.addEventListener("open", onOpen);
    es.addEventListener("error", onError);
    es.addEventListener("hello", onHello);
    es.addEventListener("telemetry", onTelemetry);

    const id = setInterval(measureLatency, 10000);

    return () => {
      clearInterval(id);
      es.removeEventListener("open", onOpen);
      es.removeEventListener("error", onError);
      es.removeEventListener("hello", onHello);
      es.removeEventListener("telemetry", onTelemetry);
      try { es.close(); } catch {}
    };
  }, [measureLatency]);

  return {
    connected, latencyMs,
    telemetry, snapshot,
    sendControl, setMode, requestPhoto
  };
}
