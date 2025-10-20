import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react"; // Importamos Auth0

const API_BASE = import.meta.env.VITE_API_URL;
const SSE_URL = import.meta.env.VITE_SSE_URL;

export default function useApi() {

    const esRef = useRef(null);
    const { getAccessTokenSilently } = useAuth0(); // Usamos getAccessTokenSilently como función
    const [connected, setConnected] = useState(false);
    const [latencyMs, setLatencyMs] = useState(null);
    const [telemetry, setTelemetry] = useState(null); 
    const [snapshot, setSnapshot] = useState(null); 
    const [logs, setLogs] = useState([]); // Logs para historial de mensajes SSE

    const post = useCallback(async (path, body) => {
        let token;
        try {
            token = await getAccessTokenSilently();
        } catch (e) {
            console.error("Auth0 token acquisition failed", e);
        }

        const res = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Incluir token solo si existe
                ...(token && { "Authorization": `Bearer ${token}` })
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }, [getAccessTokenSilently, API_BASE]);

    // Enviar órdenes: Todos los comandos (incluido el cambio de modo) van por aquí
    const sendControl = useCallback((task, args = {}, robotId) => {
        // CORRECCIÓN RUTA: Apunta a la ruta correcta del Backend
        return post("/api/robot/command", { task, args, robotId });
    }, [post]);

    // FUNCIÓN ELIMINADA: setMode ya no existe aquí, ahora se usa sendControl
    // para enviar task: "change_mode"

    const measureLatency = useCallback(async () => {
        const to = Date.now();
        try {
            await fetch(`${API_BASE}/health`, { cache: "no-store" });
            setLatencyMs(Date.now() - to);
        } catch {
            setLatencyMs(null);
        }
    }, [API_BASE]);

    const onLog = useCallback((ev) => {
        try {
            const data = JSON.parse(ev.data);
            setLogs(prevLogs => [
                {
                    id: Date.now() + Math.random(), 
                    timestamp: Date.now(),
                    ...data
                },
                ...prevLogs.slice(0, 49) 
            ]);
        } catch (e) {
            console.error("Error parsing log event:", e);
        }
    }, []);


    useEffect(() => {
        // Abrir EventSource (SSE)
        const es = new EventSource(SSE_URL, { withCredentials: false });
        esRef.current = es;

        const onOpen = () => { setConnected(true); measureLatency(); };
        const onError = () => { setConnected(false); };
        
        const onTelemetry = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                setTelemetry(data);

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
        es.addEventListener("telemetry", onTelemetry);
        es.addEventListener("log_event", onLog); // Listener para logs/ACKs

        const id = setInterval(measureLatency, 10000);

        return () => {
            clearInterval(id);
            es.removeEventListener("open", onOpen);
            es.removeEventListener("error", onError);
            es.removeEventListener("telemetry", onTelemetry);
            es.removeEventListener("log_event", onLog);
            try { es.close(); } catch {}
        };
    }, [measureLatency, onLog]);

    return {
        connected, latencyMs,
        telemetry, snapshot, logs,
        sendControl // setMode ya no se exporta
    };
}