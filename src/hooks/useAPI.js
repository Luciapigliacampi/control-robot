import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react"; // ⬅️ NUEVO: Importar Auth0

// Usamos VITE_API_URL para la URL base (según tu .env)
const API_BASE = import.meta.env.VITE_API_URL; 
const SSE_URL = import.meta.env.VITE_SSE_URL; // ⬅️ VITE_SSE_URL

export default function useApi() {
 const esRef = useRef(null);
  // ⬅️ NUEVO: Obtener funciones de Auth0
  const { getAccessTokenSilently } = useAuth0(); 
 const [connected, setConnected] = useState(false);
 const [latencyMs, setLatencyMs] = useState(null);

 const [telemetry, setTelemetry] = useState(null); // {battery, mode, status, mast, power,...}
 const [snapshot, setSnapshot]  = useState(null); // { snapshotUrl, description?, ts? }
 
 // 1. NUEVO ESTADO: logs para almacenar el historial de mensajes SSE
 const [logs, setLogs] = useState([]); 

 // 2. Modificar la función post para adjuntar el Token JWT
 const post = useCallback(async (path, body) => {
    let token;
    try {
        // Obtener el token JWT de forma silenciosa
        token = await getAccessTokenSilently();
    } catch (e) { // ⬅️ CORREGIDO 'chatch' -> 'catch'
        console.error("Auth0 token acquisition failed:", e);
        // Si el token falla, el backend denegará el acceso con 401
    }

  const res = await fetch(`${API_BASE}${path}`, {
   method: "POST",
   headers: { 
          "Content-Type": "application/json",
          // ⬅️ INYECTAR TOKEN JWT
          ...(token && { "Authorization": `Bearer ${token}` }) 
      },
   body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
  // Incluir getAccessTokenSilently como dependencia
 }, [getAccessTokenSilently, API_BASE]); 

 // Enviar órdenes: CORREGIR RUTA a /api/robot/command
 const sendControl = useCallback((task, args = {}, robotId) => {
  // ⬅️ RUTA CORREGIDA para coincidir con el Back-end (server.js)
  return post("/api/robot/command", { task, args, robotId }); 
 }, [post]);

 // Cambiar modo (si lo decidieron usar por endpoint aparte)
 const setMode = useCallback((value, robotId) => {
  // Asumiendo que /api/commands/mode es un alias, lo corregimos también si usa post.
    // Si el backend solo usa /api/robot/command, este endpoint podría ser obsoleto, 
    // pero lo dejamos apuntando a la ruta principal para seguridad.
  return post("/api/robot/command", { task: "change_mode", value, robotId }); 
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
 }, [API_BASE]);

 // 2. NUEVA FUNCIÓN: Manejar los eventos de log (ACKs, errores, info)
 const onLog = (ev) => {
  try {
   const data = JSON.parse(ev.data);
   setLogs(prevLogs => [
    { 
     id: Date.now() + Math.random(), // Generar un ID único para la key de React
     timestamp: Date.now(),
     ...data 
    }, 
    ...prevLogs.slice(0, 49) // Mantener solo los últimos 50 logs
   ]);
  } catch (e) {
   console.error("Error parsing log event:", e);
  }
 };


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
  
  // Suscribirse al evento de logs/ACKs
  es.addEventListener("log_event", onLog); 

  const id = setInterval(measureLatency, 10000);

  return () => {
   clearInterval(id);
   es.removeEventListener("open", onOpen);
   es.removeEventListener("error", onError);
   es.removeEventListener("hello", onHello);
   es.removeEventListener("telemetry", onTelemetry);
   es.removeEventListener("log_event", onLog); 
   try { es.close(); } catch {}
  };
 }, [measureLatency, API_BASE]);

 return {
  connected, latencyMs,
  telemetry, snapshot,
  logs, 
  sendControl, setMode, requestPhoto
 };
}