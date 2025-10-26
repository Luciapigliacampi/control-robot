// src/services/commands.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ROBOT_ID = import.meta.env.VITE_ROBOT_ID || "507f1f77bcf86cd799439011";

// Ruta única válida en tu backend de Render
const PATH = "/api/robot/command";

// cache del formato que funcionó: 'arch' | 'task'
let cachedVariant = null;

// Helpers de mapeo para el fallback "task"
const MAP = {
  move: (d) => (d === "forward" ? "move_forward" : "move_backward"),
  turn: (d) => (d === "left" ? "turn_left" : "turn_right"),
  lift: (d) => (d === "up" ? "lift_up" : "lift_down"),
  tilt: (d) => (d === "up" ? "tilt_up" : "tilt_down"),
};

async function post(body) {
  try {
    const res = await fetch(`${API_BASE}${PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, text };
    }
    return { ok: true, json: await res.json().catch(() => ({})) };
  } catch (e) {
    return { ok: false, status: 0, text: String(e) };
  }
}

async function sendWithVariants(buildArch, buildTask) {
  // si ya sabemos qué formato acepta, usamos ese directo
  if (cachedVariant) {
    const body = cachedVariant === "arch" ? buildArch() : buildTask();
    return post(body);
  }

  // 1) intento: arquitectura pactada
  const a = await post(buildArch());
  if (a.ok) {
    cachedVariant = "arch";
    console.info(`[commands] usando arch → ${PATH}`);
    return a;
  }

  // 2) fallback: formato task/args
  const b = await post(buildTask());
  if (b.ok) {
    cachedVariant = "task";
    console.info(`[commands] usando task → ${PATH}`);
    return b;
  }

  // si nada funcionó, log útil (solo una vez visible aquí)
  console.warn("[commands] ninguna variante aceptada", { archErr: a, taskErr: b });
  return b.ok ? b : a;
}

/* ==================== Acciones de alto nivel ==================== */

export function sendMove(direction) {
  return sendWithVariants(
    // contrato pactado
    () => ({ robotId: ROBOT_ID, commandType: "move", content: { direction }, source: "web_ui" }),
    // fallback task/args
    () => ({ robotId: ROBOT_ID, task: MAP.move(direction), args: {}, source: "web_ui" }),
  );
}

export function sendTurn(direction) {
  return sendWithVariants(
    () => ({ robotId: ROBOT_ID, commandType: "turn", content: { direction }, source: "web_ui" }),
    () => ({ robotId: ROBOT_ID, task: MAP.turn(direction), args: {}, source: "web_ui" }),
  );
}

export function sendLift(direction) {
  return sendWithVariants(
    () => ({ robotId: ROBOT_ID, commandType: "lift", content: { direction }, source: "web_ui" }),
    () => ({ robotId: ROBOT_ID, task: MAP.lift(direction), args: {}, source: "web_ui" }),
  );
}

export function sendTilt(direction) {
  return sendWithVariants(
    () => ({ robotId: ROBOT_ID, commandType: "tilt", content: { direction }, source: "web_ui" }),
    () => ({ robotId: ROBOT_ID, task: MAP.tilt(direction), args: {}, source: "web_ui" }),
  );
}

export function setMode(mode) {
  return sendWithVariants(
    () => ({ robotId: ROBOT_ID, commandType: "mode", content: { mode }, source: "web_ui" }),
    () => ({ robotId: ROBOT_ID, task: "change_mode", args: { value: mode }, source: "web_ui" }),
  );
}

export function startAuto() {
  return sendWithVariants(
    () => ({ robotId: ROBOT_ID, commandType: "start", source: "web_ui" }),
    () => ({ robotId: ROBOT_ID, task: "start_route", args: {}, source: "web_ui" }),
  );
}

export function stopAll() {
  return sendWithVariants(
    () => ({ robotId: ROBOT_ID, commandType: "stop", source: "web_ui" }),
    () => ({ robotId: ROBOT_ID, task: "stop", args: {}, source: "web_ui" }),
  );
}

export function takePhoto() {
  return sendWithVariants(
    () => ({ robotId: ROBOT_ID, commandType: "take_photo", content: {}, source: "web_ui" }),
    () => ({ robotId: ROBOT_ID, task: "capture_image", args: {}, source: "web_ui" }),
  );
}
