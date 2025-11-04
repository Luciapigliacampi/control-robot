// src/services/api.js
// Base única para la API (Render en producción o localhost en dev)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";


/**
 * POST /api/auth/signup
 * Crea un nuevo usuario (por defecto con rol "operator")
 */
export async function signupUser({ auth0Id, name, email }) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth0Id, name, email }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`signup_failed: ${msg}`);
  }

  return res.json();
}

/**
 * POST /api/auth/login
 * Verifica si el usuario existe en la base de datos
 */
export async function loginUser({ email }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`login_failed: ${msg}`);
  }

  return res.json();
}
/**
 * GET /api/status
 * Respuesta esperada: { robot, logs? }
 */
export async function getStatus() {
  const r = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
  if (!r.ok) throw new Error("status_failed");
  return r.json();
}

/**
 * GET /api/images
 * Respuesta esperada: { total, images: [{ _id, robotId, url, type, description, timestamp }, ...] }
 */
export async function getImages() {
  const r = await fetch(`${API_BASE}/api/images`, { cache: "no-store" });
  if (!r.ok) throw new Error("images_failed");
  return r.json();
}

/**
 * Devuelve la última imagen o null.
 * Normaliza lo necesario para el front (url, timestamp, _id).
 */
export async function getLastImage() {
  const data = await getImages();
  const list = Array.isArray(data) ? data : [];
  const last = list.length ? list[list.length - 1] : null;
  if (!last) return null;
  return {
    _id: last._id,
    url: last.url,
    timestamp: last.timestamp,
    type: last.type,
    description: last.description ?? "",
    robotId: last.robotId,
  };
}

/* ──────────────────────────────────────────────────────────────
   NOTA IMPORTANTE:
   - Los COMANDOS del robot (move/turn/lift/tilt/mode/stop/take_photo)
     NO van más por este archivo. Usá:
       → src/services/commands.js
   - SSE se conecta con:
       → `${VITE_API_URL}/api/stream`
   ────────────────────────────────────────────────────────────── */
