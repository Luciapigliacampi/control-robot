// src/pages/ControlMobile.jsx
import { useEffect, useState } from "react";
import useApi from "../hooks/useAPI.js"; // HTTPS + SSE (hook nuevo)
import Header from "../components/Header.jsx";
import { useAuth0 } from "@auth0/auth0-react";
import { Play, Square, Camera, MoveUp, MoveDown, MoveUpRight, MoveDownLeft } from "lucide-react";

export default function ControlMobile() {
  const robotId = "R1";
  const {
    connected, latencyMs, telemetry, snapshot,
    // comandos de movimiento
    moveForward, moveBackward, turnLeft, turnRight, stop,
    // torre
    liftUp, liftDown, tiltUp, tiltDown,
    // modo/auto y foto
    setMode, startAuto, stopAll, takePhoto,
  } = useApi();
  const { logout } = useAuth0();

  const [mode, setLocalMode] = useState("manual");
  useEffect(() => { if (telemetry?.mode) setLocalMode(telemetry.mode); }, [telemetry?.mode]);

  const isAuto = mode === "auto";
  const running = telemetry?.status === "executing_task";
  const paused  = telemetry?.status === "paused";

  // ---- Movimiento principal (mantener/soltar) ----
  const startMove = (cmd) => (e) => {
    e.preventDefault();
    if (isAuto) return;
    switch (cmd) {
      case "move_forward":  return moveForward();
      case "move_backward": return moveBackward();
      case "turn_left":     return turnLeft();
      case "turn_right":    return turnRight();
      default: return;
    }
  };
  const stopMove = (e) => { e.preventDefault(); stop(); };

  // ---- Modo ----
  const toggleMode = async () => {
    const isExecuting = telemetry?.status === "executing_task";
    const isPaused    = telemetry?.status === "paused";
    if (mode === "auto" && (isExecuting || isPaused)) return;
    const next = mode === "auto" ? "manual" : "auto";
    setLocalMode(next);
    await setMode(next);
    if (next === "auto") await startAuto(); else await stopAll();
  };

  // ---- Torre / Inclinación (mantener/soltar) ----
  const startLift = (cmd) => (e) => {
    e.preventDefault();
    if (isAuto) return;
    if (cmd === "lift_up")   return liftUp();
    if (cmd === "lift_down") return liftDown();
    if (cmd === "tilt_up")   return tiltUp();
    if (cmd === "tilt_down") return tiltDown();
  };
  const stopLift = (e) => { e.preventDefault(); stop(); };

  // ---- Foto ----
  const onTakePhoto = () => takePhoto();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const imageDesc = snapshot?.description || telemetry?.currentTask || "—";

  return (
  <>
    {/* Header fuera de .screen para que pueda ocupar el 100% del viewport en mobile */}
    <Header title="LiftCore" onLogout={handleLogout} />

    <div className="screen">
      {/* Selector Automático / Manual */}
      <div className="row spaced" style={{ marginTop: 12 }}>
        <div className="segmented-wrap">
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
              aria-disabled={isAuto && (running || paused)}
              aria-pressed={!isAuto}
            >
              Manual
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot */}
      <div className="snapshot" style={{ marginTop: 12 }}>
        {snapshot?.snapshotUrl ? (
          <img src={snapshot.snapshotUrl} alt="Última captura" />
        ) : (
          <div className="placeholder" />
        )}
      </div>
      <div className="caption">{imageDesc}</div>

      {/* PAD direccional */}
      <section className="pad">
        <div className="pad-top-row">
          <button
            className="pad-btn up"
            onPointerDown={startMove("move_forward")}
            onPointerUp={stopMove}
            disabled={isAuto}
          >
            ▲
          </button>
          <button
            className="pad-btn camera"
            onClick={onTakePhoto}
            title="Tomar foto"
            aria-label="Tomar foto"
          >
            <Camera />
          </button>
        </div>

        <div className="pad-middle">
          <button
            className="pad-btn left"
            onPointerDown={startMove("turn_left")}
            onPointerUp={stopMove}
            disabled={isAuto}
          >
            ◀
          </button>

          <button
            className="pad-btn pause"
            onClick={() => {
              if (!isAuto) return stop();
              if (running) return stopAll();
              if (paused)  return startAuto();
              return startAuto();
            }}
            title="Iniciar / Detener"
          >
            {(!isAuto || running) ? <Square /> : <Play />}
          </button>

          <button
            className="pad-btn right"
            onPointerDown={startMove("turn_right")}
            onPointerUp={stopMove}
            disabled={isAuto}
          >
            ▶
          </button>
        </div>

        <button
          className="pad-btn down"
          onPointerDown={startMove("move_backward")}
          onPointerUp={stopMove}
          disabled={isAuto}
        >
          ▼
        </button>
      </section>

      {/* Torre e Inclinación */}
      <section className="tower-row">
        <button className="pad-btn" onPointerDown={startLift("lift_down")} onPointerUp={stopLift} disabled={isAuto} aria-label="Bajar torre"><MoveDown /></button>
        <button className="pad-btn" onPointerDown={startLift("lift_up")}   onPointerUp={stopLift} disabled={isAuto} aria-label="Subir torre"><MoveUp /></button>
        <button className="pad-btn" onPointerDown={startLift("tilt_down")} onPointerUp={stopLift} disabled={isAuto} aria-label="Inclinar abajo-izquierda"><MoveDownLeft /></button>
        <button className="pad-btn" onPointerDown={startLift("tilt_up")}   onPointerUp={stopLift} disabled={isAuto} aria-label="Inclinar arriba-derecha"><MoveUpRight /></button>
      </section>

      <div className="muted small" style={{ marginTop: 8 }}>
        Stream: {connected ? "Conectado" : "Cortado"}
      </div>
    </div>
  </>
);

}
