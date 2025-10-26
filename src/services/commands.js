// src/services/commands.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ROBOT_ID = import.meta.env.VITE_ROBOT_ID || "507f1f77bcf86cd799439011";

let cachedMode = null; // "arch" | "task" | "minimal"
let cachedPath = "/api/robot/command";

function mapMove(direction) {
  // mapeo para formato task/value
  return direction === "forward" ? "move_forward" : "move_backward";
}
function mapTurn(direction) {
  return direction === "left" ? "turn_left" : "turn_right";
}
function mapLift(direction) {
  return direction === "up" ? "lift_up" : "lift_down";
}
function mapTilt(direction) {
  return direction === "up" ? "tilt_up" : "tilt_down";
}

async function tryPost(body) {
  try {
    const res = await fetch(`${API_BASE}${cachedPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, status: res.status, text: await res.text().catch(() => "") };
    return { ok: true, json: await res.json().catch(() => ({})) };
  } catch (e) {
    return { ok: false, status: 0, text: String(e) };
  }
}

async function sendCommandVariants(variants) {
  // si ya aprendimos qué formato acepta, úsalos directo
  if (cachedMode) {
    const chosen = variants.find(v => v.mode === cachedMode);
    if (chosen) return tryPost(chosen.body);
  }

  for (const v of variants) {
    const r = await tryPost(v.body);
    if (r.ok) {
      cachedMode = v.mode;
      console.info(`[commands] usando ${cachedMode} → ${cachedPath}`);
      return r;
    }
    // 400/422: rechazado por validación → probamos siguiente
    // 404: significaría que cambió la ruta; aquí siempre usamos /api/robot/command
  }
  // si ninguna variante pasó, devolvemos el último error útil
  const last = variants[variants.length - 1];
  return { ok: false, error: `Ningún formato aceptado en ${cachedPath}.` };
}

// ===== acciones de alto nivel =====
export async function sendMove(direction) {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "move", content: { direction } } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: mapMove(direction), args: {} } },
    { mode: "minimal", body: { task: mapMove(direction) } },
  ];
  return sendCommandVariants(variants);
}
export async function sendTurn(direction) {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "turn", content: { direction } } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: mapTurn(direction), args: {} } },
    { mode: "minimal", body: { task: mapTurn(direction) } },
  ];
  return sendCommandVariants(variants);
}
export async function sendLift(direction) {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "lift", content: { direction } } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: mapLift(direction), args: {} } },
    { mode: "minimal", body: { task: mapLift(direction) } },
  ];
  return sendCommandVariants(variants);
}
export async function sendTilt(direction) {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "tilt", content: { direction } } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: mapTilt(direction), args: {} } },
    { mode: "minimal", body: { task: mapTilt(direction) } },
  ];
  return sendCommandVariants(variants);
}
export async function setMode(mode) {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "mode", content: { mode } } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: "change_mode", args: { value: mode } } },
    { mode: "minimal", body: { task: "change_mode" } },
  ];
  return sendCommandVariants(variants);
}
export async function startAuto() {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "start" } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: "start_route", args: {} } },
    { mode: "minimal", body: { task: "start_route" } },
  ];
  return sendCommandVariants(variants);
}
export async function stopAll() {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "stop" } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: "stop", args: {} } },
    { mode: "minimal", body: { task: "stop" } },
  ];
  return sendCommandVariants(variants);
}
export async function takePhoto() {
  const variants = [
    { mode: "arch", body: { robotId: ROBOT_ID, source: "web_ui", commandType: "take_photo", content: {} } },
    { mode: "task", body: { robotId: ROBOT_ID, source: "web_ui", task: "capture_image", args: {} } },
    { mode: "minimal", body: { task: "capture_image" } },
  ];
  return sendCommandVariants(variants);
}
