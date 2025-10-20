// src/pages/ControlMobile.jsx
import { useEffect, useState } from "react";
import useApi from "../hooks/useApi.js"; // HTTPS + SSE
import Header from "../components/Header.jsx";
import PowerSwitch from "../components/PowerSwitch.jsx";
import { useAuth0 } from "@auth0/auth0-react";

export default function ControlMobile() {
  const robotId = "R1";

  // Eliminamos 'setMode' de la desestructuración de useApi.js
  const { connected, latencyMs, telemetry, snapshot, sendControl, logs = [] } = useApi();
  const { logout } = useAuth0();

  const [mode, setLocalMode] = useState("manual");

  // Sincronizar el modo con la telemetría recibida
  useEffect(() => {
    if (telemetry?.mode) setLocalMode(telemetry.mode);
  }, [telemetry?.mode]);

  // ---- POWER: estado optimista + sincronía con telemetría ----
  const [powerLocal, setPowerLocal] = useState("off");
  const [powerPending, setPowerPending] = useState(false);

  useEffect(() => {
    if (telemetry?.power && !powerPending) {
      setPowerLocal(telemetry.power); // "on" | "off"
    }
  }, [telemetry?.power, powerPending]);

  const onTogglePower = async (nextChecked) => {
    const next = nextChecked ? "on" : "off";
    setPowerLocal(next); // optimista
    setPowerPending(true);
    try {
      await sendControl(next === "on" ? "power_on" : "power_off", {}, robotId);
      setTimeout(() => setPowerPending(false), 1200);
    } catch (e) {
      setPowerLocal((prev) => (prev === "on" ? "off" : "on"));
      setPowerPending(false);
      console.error("power toggle failed:", e);
    }
  };

  // ---- RESTO DE ACCIONES Y FUNCIONES DE MOVIMIENTO CONTINUO ----
  const isAuto = mode === "auto";

  // Asegurate que el SSE emita exactamente estos estados
  const running = telemetry?.status === "executing_task"; // en ejecución (auto)
  const paused  = telemetry?.status === "paused";         // en pausa (auto)

  // Funciones para INICIAR y DETENER movimiento continuo (modo manual)
  const startMove = (cmd) => (e) => {
    e.preventDefault();
    sendControl(cmd, { state: "down" }, robotId); // 'down' para simular continuo
  };

  const stopMove = (e) => {
    e.preventDefault();
    sendControl("stop", { state: "up" }, robotId);
  };

  // Bloqueo de cambio de modo cuando está ejecutando/pausado en automático
  const toggleMode = () => {
    const isExecuting = telemetry?.status === "executing_task";
    const isPaused    = telemetry?.status === "paused";

    if (mode === "auto" && (isExecuting || isPaused)) {
      // Opcional: toast/alert accesible
      // alert("Primero detén el recorrido para cambiar a Manual.");
      return;
    }

    const next = mode === "auto" ? "manual" : "auto";
    setLocalMode(next);
    // CORRECCIÓN CLAVE: Usar sendControl para la task 'change_mode'
    sendControl("change_mode", { value: next }, robotId);
  };

  const pause = () =>
    isAuto && running ? sendControl("pause_route", {}, robotId)
                      : sendControl("stop", {}, robotId);

  const startLift = (cmd) => (e) => {
    e.preventDefault();
    sendControl(cmd, {}, robotId);
  };

  const stopLift = (e) => {
    e.preventDefault();
    sendControl("lift_stop", {}, robotId);
  };

  const tiltForward  = () => sendControl("tilt_forward",  {}, robotId);
  const tiltBackward = () => sendControl("tilt_backward", {}, robotId);
  const takePhoto    = () => sendControl("capture_image", {}, robotId);

  // Botón principal (INICIAR / PARAR / REANUDAR) – solo en Automático
  const onPrimary = () => {
    if (!isAuto) return; // en Manual no hace nada
    if (running) return sendControl("stop", {}, robotId);
    if (paused)  return sendControl("resume_route", {}, robotId);
    return sendControl("start_route", {}, robotId);
  };

  // ---- Funciones de Auth ----
  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // ---- datos de UI ----
  const battery = telemetry?.battery ?? "--";
  const status  = telemetry?.status ?? "--";
  const mast    = telemetry?.mast ?? "--";
  const ms      = Number.isFinite(latencyMs) ? `${latencyMs} ms` : "— ms";
  const imageDesc = snapshot?.description || telemetry?.currentTask || "—";

  return (
    <div className="screen">
      <Header title="LiftCore" onLogout={handleLogout} />

      <div className="status-strip">
        <span className="chip ok">SOS</span>
        <span>Batería: <strong>{battery}%</strong></span>
        <span>Estado: <strong>{status}</strong></span>
        <span>Modo: <strong>{mode}</strong></span>
        <span>Torre: <strong>{mast}</strong></span>
        <span className="chip">{ms}</span>
      </div>

      <div className="row spaced">
        <PowerSwitch
          checked={powerLocal === "on"}
          onChange={onTogglePower}
          disabled={powerPending}
        />

        {/* Selector de modo con bloqueo visual (UX) */}
        <div className="segmented">
          <button
            className={`seg ${isAuto ? "active" : ""}`}
            onClick={() => !isAuto && toggleMode()}
            aria-pressed={isAuto}
          >
            Automático
          </button>

          <button
            className={`seg ${!isAuto ? "active" : ""}`}
            onClick={() => isAuto && toggleMode()}
            disabled={isAuto && (running || paused)}
            title={isAuto && (running || paused)
              ? "Detén el recorrido para cambiar a Manual"
              : undefined}
            aria-disabled={isAuto && (running || paused)}
            aria-pressed={!isAuto}
          >
            Manual
          </button>
        </div>

        <button className="icon-btn" onClick={takePhoto} title="Tomar foto">📷</button>
      </div>

      <section className="card">
        <div className="snapshot">
          {snapshot?.snapshotUrl ? (
            <img src={snapshot.snapshotUrl} alt="Última captura" />
          ) : (
            <div className="placeholder" />
          )}
        </div>
        <div className="caption">{imageDesc}</div>
      </section>

      <section className="card mini">
        <div className="mini-left">⚠️</div>
        <div className="mini-mid">
          <div className="metric">Paso</div>
          <div className="muted">{telemetry?.currentTask ?? "—"}</div>
        </div>
      </section>

      {/* PAD direccional (Manual habilitado, Auto deshabilitado) */}
      <section className="pad">
        {/* Arriba (Adelante) */}
        <button
          className="pad-btn up"
          onPointerDown={startMove("move_forward")}
          onPointerUp={stopMove}
          onPointerCancel={stopMove}
          onPointerLeave={stopMove}
          disabled={isAuto}
        >
          ▲
        </button>

        <div className="pad-middle">
          {/* Izquierda */}
          <button
            className="pad-btn left"
            onPointerDown={startMove("turn_left")}
            onPointerUp={stopMove}
            onPointerCancel={stopMove}
            onPointerLeave={stopMove}
            disabled={isAuto}
          >
            ◀
          </button>

          {/* PAUSA – solo cuando auto + running */}
          <button
            className="pad-btn pause"
            onClick={pause}
            disabled={!isAuto || !running}
            title={!isAuto ? "Solo disponible en Automático" : (!running ? "Inicia el recorrido para pausar" : "Pausar")}
          >
            ⏸
          </button>

          {/* Derecha */}
          <button
            className="pad-btn right"
            onPointerDown={startMove("turn_right")}
            onPointerUp={stopMove}
            onPointerCancel={stopMove}
            onPointerLeave={stopMove}
            disabled={isAuto}
          >
            ▶
          </button>
        </div>

        {/* Abajo (Atrás) */}
        <button
          className="pad-btn down"
          onPointerDown={startMove("move_backward")}
          onPointerUp={stopMove}
          onPointerCancel={stopMove}
          onPointerLeave={stopMove}
          disabled={isAuto}
        >
          ▼
        </button>
      </section>

      {/* Torre / Inclinación (Manual habilitado, Auto deshabilitado) */}
      <div className="row two">
        <button
          className="btn"
          onPointerDown={startLift("lift_up")}
          onPointerUp={stopLift}
          onPointerCancel={stopLift}
          onPointerLeave={stopLift}
          disabled={isAuto}
        >
          SUBIR TORRE
        </button>

        <button
          className="btn"
          onPointerDown={startLift("lift_down")}
          onPointerUp={stopLift}
          onPointerCancel={stopLift}
          onPointerLeave={stopLift}
          disabled={isAuto}
        >
          BAJAR TORRE
        </button>
      </div>

      <div className="row two">
        <button className="btn" onClick={tiltForward}  disabled={isAuto}>INCLINAR ↑</button>
        <button className="btn" onClick={tiltBackward} disabled={isAuto}>INCLINAR ↓</button>
      </div>

      {/* Botón principal – solo en Automático */}
      <button className="btn primary block" disabled={!isAuto} onClick={onPrimary}>
        {running ? "PARAR" : (paused ? "REANUDAR" : "INICIAR")}
      </button>

      {/* E-STOP: recomendado dejar SIEMPRE habilitado por seguridad */}
      <button
  className={`estop fab local ${running ? "armed" : ""}`}
  onClick={() => sendControl("stop", {}, robotId)}
>
  E-STOP
</button>


      <div className="muted small" style={{ marginTop: 8 }}>
        Stream: {connected ? "Conectado" : "Cortado"}
      </div>
    </div>
  );
}
