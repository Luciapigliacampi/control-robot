// ✅ src/services/sse.js
// Este módulo maneja la conexión con el backend usando Server-Sent Events (SSE)
// y está alineado con la arquitectura de comunicación actual del robot-backend.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Conectar a SSE del backend.
 *
 * Parámetros:
 *   on = {
 *     onOpen?:      () => void,
 *     onError?:     (error) => void,
 *     onTelemetry?: (payload) => void,
 *     onNewImage?:  (payload) => void,
 *     onObstacle?:  (payload) => void
 *   }
 *
 * Ejemplo de uso:
 *   connectSSE({
 *     onOpen: () => console.log("SSE conectado"),
 *     onNewImage: (img) => console.log("Nueva imagen:", img)
 *   });
 */
export function connectSSE(on = {}) {
  // Abrimos la conexión al stream SSE
  const src = new EventSource(`${API_BASE}/api/stream`);

  // 🔌 Conectado correctamente
  if (on.onOpen)
    src.addEventListener("robot_connected", () => {
      console.log("[SSE] Conectado al servidor");
      on.onOpen();
    });

  // ❌ Error en la conexión
  if (on.onError)
    src.addEventListener("robot_error", (e) => {
      console.error("[SSE] Error o desconexión:", e);
      on.onError(e);
    });

  // 📡 Evento de telemetría del robot
  if (on.onTelemetry)
    src.addEventListener("telemetry", (ev) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        on.onTelemetry(data);
      } catch (err) {
        console.warn("[SSE] Error parseando telemetría:", err);
      }
    });

  // 🖼️ Evento: nueva imagen disponible
  if (on.onNewImage)
    src.addEventListener("new_image", (ev) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        console.log("[SSE] Nueva imagen detectada:", data);
        on.onNewImage(data);
      } catch (err) {
        console.warn("[SSE] Error parseando new_image:", err);
      }
    });

  // 🚧 Evento: obstáculo detectado
  if (on.onObstacle)
    src.addEventListener("obstacle_detected", (ev) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        console.log("[SSE] Obstáculo detectado:", data);
        on.onObstacle(data);
      } catch (err) {
        console.warn("[SSE] Error parseando obstacle_detected:", err);
      }
    });

  // 🔕 Retornar función de limpieza (para cerrar conexión)
  return () => {
    try {
      src.close();
      console.log("[SSE] Conexión cerrada correctamente");
    } catch (err) {
      console.warn("[SSE] Error al cerrar conexión:", err);
    }
  };
}
