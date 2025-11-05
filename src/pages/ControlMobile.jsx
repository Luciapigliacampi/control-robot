// src/pages/ControlMobile.jsx
import { useEffect, useState } from "react";
import useApi from "../hooks/useApi.js";
import Header from "../components/Header.jsx";
import VoiceRecorder from "../components/VoiceRecorder.jsx";
import { useAuth0 } from "@auth0/auth0-react";
import { Play, Square, Camera, MoveUp, MoveDown, MoveUpRight, MoveDownLeft } from "lucide-react";

export default function ControlMobile() {
  const {
    connected, telemetry, snapshot,
    moveForward, moveBackward, turnLeft, turnRight, stop,
    liftUp, liftDown, tiltUp, tiltDown,
    setMode, startAuto, stopAll, takePhoto,
  } = useApi();
  const { logout } = useAuth0();


  const [mode, setLocalMode] = useState("manual");
  useEffect(() => { if (telemetry?.mode) setLocalMode(telemetry.mode); }, [telemetry?.mode]);

  const isAuto  = mode === "auto";
  const running = telemetry?.status === "executing_task";
  const paused  = telemetry?.status === "paused";

  // ---- Movimiento principal (mantener/soltar) ----
  const startMove = (cmd) => (e) => {
    e.preventDefault();
    if (isAuto) return;
    if (cmd === "move_forward")  return moveForward();
    if (cmd === "move_backward") return moveBackward();
    if (cmd === "turn_left")     return turnLeft();
    if (cmd === "turn_right")    return turnRight();
  };
  const stopMove = (e) => { e.preventDefault(); stop(); };

  // ---- Modo ---- (no inicia auto; el botón central decide)
  const toggleMode = async () => {
    const isExecuting = telemetry?.status === "executing_task";
    const isPaused    = telemetry?.status === "paused";
    if (mode === "auto" && (isExecuting || isPaused)) return;

    const next = mode === "auto" ? "manual" : "auto";
    setLocalMode(next);
    await setMode(next);

    if (next === "manual") {
      // Opcional: al salir de auto, detener todo
      await stopAll();
    }
    // 👇 NO llamamos a startAuto aquí
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

    // === FIX B helpers: clase is-pressing + handlers de mantener ===
  const makePressHandlers = (startFn, endFn) => ({
    onPointerDown:  (e) => { e.preventDefault(); e.currentTarget.classList.add("is-pressing"); startFn(e); },
    onPointerUp:    (e) => { e.preventDefault(); e.currentTarget.classList.remove("is-pressing"); endFn(e); },
    onPointerLeave: (e) => { e.preventDefault(); e.currentTarget.classList.remove("is-pressing"); endFn(e); },
    onPointerCancel:(e) => { e.preventDefault(); e.currentTarget.classList.remove("is-pressing"); endFn(e); },
  });

  // ---- Foto ----
  // const onTakePhoto = () => takePhoto();
  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  const makeClickPressHandlers = (clickFn) => ({
  onPointerDown: (e) => { e.preventDefault(); e.currentTarget.classList.add("is-pressing"); },
  onPointerUp: (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("is-pressing");
    clickFn(); // Llama a la acción de click solo al soltar
  },
  onPointerLeave: (e) => { e.preventDefault(); e.currentTarget.classList.remove("is-pressing"); },
  onPointerCancel: (e) => { e.preventDefault(); e.currentTarget.classList.remove("is-pressing"); },
});

  const imageDesc = snapshot?.description || telemetry?.currentTask || "—";

  return (
    <>
      {/* Header fijo */}
      <Header title="LiftCore" onLogout={handleLogout} />

      {/* Contenido */}
      <div
  className="screen control-full has-fixed-header no-select"
  onContextMenu={(e) => e.preventDefault()}
>
        {/* Selector Automático / Manual */}
        <div className="row spaced">
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
        <div className="snapshot">
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
              {...makePressHandlers(startMove("move_forward"), stopMove)}
              onContextMenu={(e)=>e.preventDefault()}
              disabled={isAuto}
              aria-label="Mover hacia adelante"
            >
              ▲
            </button>

            {/* Botón de la Cámara */}
            <button
              className="pad-btn camera"
              {...makeClickPressHandlers(takePhoto)}
              title="Tomar foto"
              aria-label="Tomar foto"
            >
              <Camera />
            </button>

            {/* Micrófono (derecha) */}
            <VoiceRecorder />
          </div>

          <div className="pad-middle">
            <button
              className="pad-btn left"
              {...makePressHandlers(startMove("turn_left"), stopMove)}
              onContextMenu={(e)=>e.preventDefault()}
              disabled={isAuto}
              aria-label="Girar a la izquierda"
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
              aria-label="Iniciar o detener"
            >
              {(!isAuto || running) ? <Square /> : <Play />}
            </button>

            <button
              className="pad-btn right"
              {...makePressHandlers(startMove("turn_right"), stopMove)}
              onContextMenu={(e)=>e.preventDefault()}
              disabled={isAuto}
              aria-label="Girar a la derecha"
            >
              ▶
            </button>
          </div>

          <button
            className="pad-btn down"
            {...makePressHandlers(startMove("move_backward"), stopMove)}
            onContextMenu={(e)=>e.preventDefault()}
            disabled={isAuto}
            aria-label="Mover hacia atrás"
          >
            ▼
          </button>
        </section>

        {/* Torre e Inclinación */}
        <section className="tower-row">
          <button
            className="pad-btn"
            {...makePressHandlers(startLift("lift_down"), stopLift)}
            disabled={isAuto}
            aria-label="Bajar torre"
          ><MoveDown /></button>

          <button
            className="pad-btn"
            {...makePressHandlers(startLift("lift_up"), stopLift)}
            disabled={isAuto}
            aria-label="Subir torre"
          ><MoveUp /></button>

          <button
            className="pad-btn"
            {...makePressHandlers(startLift("tilt_down"), stopLift)}
            disabled={isAuto}
            aria-label="Inclinar abajo-izquierda"
          ><MoveDownLeft /></button>

          <button
            className="pad-btn"
            {...makePressHandlers(startLift("tilt_up"), stopLift)}
            disabled={isAuto}
            aria-label="Inclinar arriba-derecha"
          ><MoveUpRight /></button>
        </section>

        <div className="muted small" style={{ marginTop: 4 }}>
          Stream: {connected ? "Conectado" : "Cortado"}
        </div>
      </div>
    </>
  );
}
