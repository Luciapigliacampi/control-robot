// src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * POST /api/robot/command
 * Body (nuevo protocolo):
 * {
 *   robotId: "R1",
 *   commandType: "move" | "turn" | "lift" | "tilt" | "mode" | "start" | "stop" | "take_photo",
 *   content?: { ... }   // solo si aplica (p.ej. { direction: "forward" } ó { mode: "auto" })
 * }
 * No enviar nonce/status/timestamp desde el Front.
 */
export async function postCommand({ robotId, commandType, content, source }) {
  if (!robotId) throw new Error("robotId is required");
  if (!commandType) throw new Error("commandType is required");

  // armamos el body sin campos vacíos
  const body = { robotId, commandType };
  if (content && Object.keys(content).length) body.content = content;
  if (source) body.source = source; // opcional (ej: "web_ui")

  const res = await fetch(`${API_BASE}/api/robot/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}

/** GET /api/status -> { robot, logs? } */
export async function getStatus() {
  const res = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Obtener imágenes registradas.
 * 1) Intenta /api/webhook/images  -> { total, storedImages:[...] }
 * 2) Fallback /api/robot/image     -> { total, images:[...] }
 * Normaliza a { total, list:[{ _id, robotId, url, timestamp, type, description }], shape }
 */
export async function getWebhookImages() {
  // 1) endpoint “nuevo” (si existe en tu back)
  try {
    const r1 = await fetch(`${API_BASE}/api/webhook/images`, { cache: "no-store" });
    if (r1.ok) {
      const data = await r1.json();
      const list = Array.isArray(data?.storedImages) ? data.storedImages : [];
      return { total: data?.total ?? list.length, list, shape: "webhook" };
    }
  } catch {
    /* cae al fallback */
  }

  // 2) endpoint actual en tu back
  const r2 = await fetch(`${API_BASE}/api/robot/image`, { cache: "no-store" });
  if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
  const data2 = await r2.json();
  const list2 = Array.isArray(data2?.images) ? data2.images : [];
  const normalized = list2.map((it) => ({
    _id: it._id,
    robotId: it.robotId,
    url: it.url,
    timestamp: it.timestamp,
    type: it.type || "other",
    description: it.description || "",
  }));
  return { total: data2?.total ?? normalized.length, list: normalized, shape: "robot" };
}

/** Devuelve la última imagen normalizada o null */
export async function getLastImage() {
  const { list } = await getWebhookImages();
  return list.length ? list[list.length - 1] : null;
}
