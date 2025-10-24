// src/services/sse.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Conecta al SSE y registra listeners independientes.
 * Devuelve una función `disconnect()` para cerrar la conexión.
 */
export function connectSSE({
  onOpen,
  onError,
  onTelemetry,     // si tu back emite "telemetry"
  onNewImage,      // handler para "new_image"
  onObstacle,      // handler para "obstacle_detected"
} = {}) {
  const src = new EventSource(`${API_BASE}/api/stream`);

  // conexión / error
  src.addEventListener("open", (e) => onOpen?.(e));
  src.onerror = (err) => {
    onError?.(err);
    try { src.close(); } catch {}
  };

  // heartbeat opcional
  src.addEventListener("ping", (e) => {
    // console.debug("[SSE] ping:", e.data);
  });

  // eventos
  src.addEventListener("new_image", (e) => {
    try { onNewImage?.(e.data ? JSON.parse(e.data) : null); }
    catch { onNewImage?.(null); }
  });

  src.addEventListener("obstacle_detected", (e) => {
    try { onObstacle?.(e.data ? JSON.parse(e.data) : null); }
    catch { onObstacle?.(null); }
  });

  src.addEventListener("telemetry", (e) => {
    try { onTelemetry?.(e.data ? JSON.parse(e.data) : null); }
    catch { onTelemetry?.(null); }
  });

  // cleanup
  return function disconnect() {
    try { src.close(); } catch {}
  };
}
