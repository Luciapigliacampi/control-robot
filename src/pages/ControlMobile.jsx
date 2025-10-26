// src/pages/ControlMobile.jsx
import { useEffect, useState } from "react";
import useApi from "../hooks/useApi.js"; // HTTPS + SSE (hook nuevo)
import Header from "../components/Header.jsx";
// import PowerSwitch from "../components/PowerSwitch.jsx";
import { useAuth0 } from "@auth0/auth0-react";
import { Play, Square, Camera, MoveUp, MoveDown, MoveUpRight, MoveDownLeft } from "lucide-react";

export default function ControlMobile() {
  const robotId = "R1"; // (si tu hook usa el interno, no hace falta; lo dejo por compat)
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

  useEffect(() => {
    if (telemetry?.mode) setLocalMode(telemetry.mode);
  }, [telemetry?.mode]);

  // const [powerLocal, setPowerLocal] = useState("off");
  // const [powerPending, setPowerPending] = useState(false);

  // useEffect(() => {
  //   if (telemetry?.power && !powerPending) {
  //     setPowerLocal(telemetry.power);
  //   }
  // }, [telemetry?.power, powerPending]);

  // const onTogglePower = async (nextChecked) => {
  //   const next = nextChecked ? "on" : "off";
  //   setPowerLocal(next);
  //   setPowerPending(true);
  //   try {
  //     await sendControl(next === "on" ? "power_on" : "power_off", {}, robotId);
  //     setTimeout(() => setPowerPending(false), 1200);
  //   } catch (e) {
  //     setPowerLocal((prev) => (prev === "on" ? "off" : "on"));
  //     setPowerPending(false);
  //     console.error("power toggle failed:", e);
  //   }
  // };

  const isAuto = mode === "auto";
  const running = telemetry?.status === "executing_task";
  const paused = telemetry?.status === "paused";

  // ---- Movimiento principal (mantener/soltar) ----
  const startMove = (cmd) => (e) => {
    e.preventDefault();
    if (isAuto) return; // en auto no mueve manual
    switch (cmd) {
      case "move_forward":  return moveForward();
      case "move_backward": return moveBackward();
      case "turn_left":     return turnLeft();
      case "turn_right":    return turnRight();
      default: return;
    }
  };
  const stopMove = (e) => {
    e.preventDefault();
    stop(); // soltar => stop
  };

  // ---- Modo ----
  const toggleMode = async () => {
    const isExecuting = telemetry?.status === "executing_task";
    const isPaused = telemetry?.status === "paused";
    if (mode === "auto" && (isExecuting || isPaused)) return;
    const next = mode === "auto" ? "manual" : "auto";
    setLocalMode(next);
    await setMode(next);
    if (next === "auto") await startAuto();
    else await stopAll();
  };

  // ---- Torre / Inclinación ----
  // --- Nuevo: Movimiento de la torre (continuo: mantener/soltar) ----
const startLift = (cmd) => (e) => { // Función para iniciar movimiento (al presionar)
    e.preventDefault();
    if (isAuto) return;
    
    // Movimiento de Elevación/Descenso
    if (cmd === "lift_up") return liftUp();
    if (cmd === "lift_down") return liftDown();

    // Movimiento de Inclinación/Declinación
    if (cmd === "tilt_up") return tiltUp(); 
    if (cmd === "tilt_down") return tiltDown();
};

const stopLift = (e) => { // Función para detener movimiento (al soltar)
    e.preventDefault();
    // Se utiliza el comando 'stop' general (que llama a stopAll) para detener cualquier movimiento
    stop(); 
};

// NOTA: Las funciones tiltForward y tiltBackward ya NO se necesitan, 
// ya que el JSX las llamará directamente con startLift/stopLift.

  // ---- Foto ----
  const onTakePhoto = () => takePhoto();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // const battery = telemetry?.battery ?? "--";
  // const status = telemetry?.status ?? "--";
  // const mast = telemetry?.mast ?? "--";
  // const ms = Number.isFinite(latencyMs) ? `${latencyMs} ms` : "— ms";
  const imageDesc = snapshot?.description || telemetry?.currentTask || "—";

  return (
    <div className="screen">
      <div className="header-wrap">
        <Header title="LiftCore" onLogout={handleLogout} />
      </div>

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

      {/* <section className="card mini">...</section> */}

      {/* PAD direccional */}
      <section className="pad">
        {/* Arriba (Adelante) + Cámara a la izquierda */}
        <div className="pad-top-row">
          {/* Botón “arriba” queda centrado */}
          <button
            className="pad-btn up"
            onPointerDown={startMove("move_forward")}
            onPointerUp={stopMove}
            disabled={isAuto}
          >
            ▲
          </button>

          {/* Cámara anclada a la IZQUIERDA de la pantalla */}
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
              if (paused) return startAuto();
              return startAuto();
            }}
            title="Iniciar / Detener"
          >
            {(() => {
              if (!isAuto) return <Square />;
              return running ? <Square /> : <Play />;
            })()}
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

      {/* Torre e Inclinación — 1x4 a lo ancho */}
      <section className="tower-row">
        <button
          className="pad-btn"
          onPointerDown={startLift("lift_down")}
          onPointerUp={stopLift}
          disabled={isAuto}
          aria-label="Bajar torre"
        >
          <MoveDown />
        </button>

        <button
          className="pad-btn"
          onPointerDown={startLift("lift_up")}
          onPointerUp={stopLift}
          disabled={isAuto}
          aria-label="Subir torre"
        >
          <MoveUp />
        </button>

        <button
     className="pad-btn"
     onPointerDown={startLift("tilt_down")} // ✅ Iniciar inclinación al presionar
     onPointerUp={stopLift}                // ✅ Detener al soltar
     disabled={isAuto}
     aria-label="Inclinar abajo-izquierda"
    >
     <MoveDownLeft />
    </button>

    <button
     className="pad-btn"
     onPointerDown={startLift("tilt_up")}   // ✅ Iniciar inclinación al presionar
     onPointerUp={stopLift}                 // ✅ Detener al soltar
     disabled={isAuto}
     aria-label="Inclinar arriba-derecha"
    >
     <MoveUpRight />
    </button>
      </section>

      {/* [REMOVED] Botón principal (ahora integrado en el botón de pausa) */}

      <div className="muted small" style={{ marginTop: 8 }}>
        Stream: {connected ? "Conectado" : "Cortado"}
      </div>
    </div>
  );
}
