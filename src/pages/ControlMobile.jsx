import { useEffect, useState } from "react";
import useApi from "../hooks/useApi.js";          // HTTPS + SSE
import Header from "../components/Header.jsx";
import PowerSwitch from "../components/PowerSwitch.jsx";

export default function ControlMobile() {
  const robotId = "R1";
  const { connected, latencyMs, telemetry, snapshot, sendControl, setMode } = useApi();

  const [mode, setLocalMode] = useState("manual");
  useEffect(() => { if (telemetry?.mode) setLocalMode(telemetry.mode); }, [telemetry?.mode]);

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
    setPowerLocal(next);        // optimista
    setPowerPending(true);
    try {
      await sendControl(next === "on" ? "power_on" : "power_off", {}, robotId);
      // si la telemetría tarda, liberamos igualmente
      setTimeout(() => setPowerPending(false), 1200);
    } catch (e) {
      // rollback si falla
      setPowerLocal(prev => (prev === "on" ? "off" : "on"));
      setPowerPending(false);
      console.error("power toggle failed:", e);
    }
  };

  // ---- resto de acciones ----
  const isAuto  = mode === "auto";
  const running = telemetry?.status === "running";
  const paused  = telemetry?.status === "paused";

  const toggleMode = () => {
    const next = mode === "auto" ? "manual" : "auto";
    setLocalMode(next);
    setMode(next, robotId);
  };

  const go    = () => sendControl("move_forward", {}, robotId);
  const back  = () => sendControl("move_backward", {}, robotId);
  const left  = () => sendControl("turn_left", {}, robotId);
  const right = () => sendControl("turn_right", {}, robotId);
  const pause = () =>
    (isAuto && running) ? sendControl("pause_route", {}, robotId)
                        : sendControl("stop", {}, robotId);

  const startLift = (cmd) => (e) => { e.preventDefault(); sendControl(cmd, {}, robotId); };
  const stopLift  = (e) => { e.preventDefault(); sendControl("lift_stop", {}, robotId); };
  const tiltForward  = () => sendControl("tilt_forward", {}, robotId);
  const tiltBackward = () => sendControl("tilt_backward", {}, robotId);
  const takePhoto    = () => sendControl("capture_image", {}, robotId);

  const onPrimary = () => {
    if (!isAuto) return;
    if (running) return sendControl("stop", {}, robotId);
    if (paused)  return sendControl("resume_route", {}, robotId);
    return sendControl("start_route", {}, robotId);
  };

  // ---- datos de UI ----
  const battery = telemetry?.battery ?? "--";
  const status  = telemetry?.status  ?? "--";
  const mast    = telemetry?.mast    ?? "--";
  const ms      = Number.isFinite(latencyMs) ? `${latencyMs} ms` : "— ms";
  const imageDesc = snapshot?.description || telemetry?.currentTask || "—";

  return (
    <div className="screen">
      <Header title="LiftCore" onMenu={() => alert("Menú")} />

      <div className="status-strip">
        <span className="chip ok">SOS</span>
        <span>Batería: <strong>{battery}%</strong></span>
        <span>Estado: <strong>{status}</strong></span>
        <span>Modo: <strong>{mode}</strong></span>
        <span>Torre: <strong>{mast}</strong></span>
        <span className="chip">{ms}</span>
      </div>

      <div className="row spaced">
        {/* OJO: PowerSwitch usa onChange, no onCheckedChange */}
        <PowerSwitch
          checked={powerLocal === "on"}
          onChange={onTogglePower}
          disabled={powerPending}
        />

        <div className="segmented">
          <button className={`seg ${isAuto ? "active" : ""}`} onClick={() => !isAuto && toggleMode()}>
            Automático
          </button>
          <button className={`seg ${!isAuto ? "active" : ""}`} onClick={() => isAuto && toggleMode()}>
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

      <section className="pad">
        <button className="pad-btn up" onClick={go}>▲</button>
        <div className="pad-middle">
          <button className="pad-btn left" onClick={left}>◀</button>
          <button className="pad-btn pause" onClick={pause}>⏸</button>
          <button className="pad-btn right" onClick={right}>▶</button>
        </div>
        <button className="pad-btn down" onClick={back}>▼</button>
      </section>

      <div className="row two">
        <button className="btn"
          onPointerDown={startLift("lift_up")}
          onPointerUp={stopLift}
          onPointerCancel={stopLift}
          onPointerLeave={stopLift}
        >SUBIR TORRE</button>

        <button className="btn"
          onPointerDown={startLift("lift_down")}
          onPointerUp={stopLift}
          onPointerCancel={stopLift}
          onPointerLeave={stopLift}
        >BAJAR TORRE</button>
      </div>

      <div className="row two">
        <button className="btn" onClick={tiltForward}>INCLINAR ↑</button>
        <button className="btn" onClick={tiltBackward}>INCLINAR ↓</button>
      </div>

      <button className="btn primary block" disabled={!isAuto} onClick={onPrimary}>
        {running ? "PARAR" : (paused ? "REANUDAR" : "INICIAR")}
      </button>

      <button className="estop" onClick={() => sendControl("stop", {}, robotId)}>E-STOP</button>

      <div className="muted small" style={{ marginTop: 8 }}>
        Stream: {connected ? "Conectado" : "Cortado"}
      </div>
    </div>
  );
}
