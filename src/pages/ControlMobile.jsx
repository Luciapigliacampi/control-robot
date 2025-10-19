import { useEffect, useState } from "react";
import useApi from "../hooks/useApi.js";// HTTPS + SSE
import Header from "../components/Header.jsx";
import PowerSwitch from "../components/PowerSwitch.jsx";
import { useAuth0 } from "@auth0/auth0-react"; // ⬅️ OBLIGATORIO: Importar Auth0

export default function ControlMobile() {
 const robotId = "R1";
 const { connected, latencyMs, telemetry, snapshot, sendControl, setMode, logs } = useApi();
 const { logout } = useAuth0(); // ⬅️ Obtener función logout

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
  setPowerLocal(next); // optimista
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

 // ---- RESTO DE ACCIONES Y FUNCIONES DE MOVIMIENTO CONTINUO ----
 const isAuto = mode === "auto";
 const running = telemetry?.status === "running";
 const paused = telemetry?.status === "paused";

  // Funciones para INICIAR y DETENER movimiento continuo (modo manual)
 const startMove = (cmd) => (e) => {
  e.preventDefault();
  sendControl(cmd, {}, robotId);
 };

 const stopMove = (e) => {
  e.preventDefault();
  sendControl("stop", {}, robotId);
 };

 const toggleMode = () => {
  const next = mode === "auto" ? "manual" : "auto";
  setLocalMode(next);
  setMode(next, robotId);
 };

 const pause = () =>
  (isAuto && running) ? sendControl("pause_route", {}, robotId)
   : sendControl("stop", {}, robotId);

 const startLift = (cmd) => (e) => { e.preventDefault(); sendControl(cmd, {}, robotId); };
 const stopLift = (e) => { e.preventDefault(); sendControl("lift_stop", {}, robotId); };
 const tiltForward = () => sendControl("tilt_forward", {}, robotId);
 const tiltBackward = () => sendControl("tilt_backward", {}, robotId);
 const takePhoto = () => sendControl("capture_image", {}, robotId);

 const onPrimary = () => {
  if (!isAuto) return;
  if (running) return sendControl("stop", {}, robotId);
  if (paused) return sendControl("resume_route", {}, robotId);
  return sendControl("start_route", {}, robotId);
 };

 // ---- Funciones de Auth ----
 const handleLogout = () => {
  // Cierre de sesión de Auth0
  logout({ logoutParams: { returnTo: window.location.origin } });
 };

 // ---- datos de UI ----
 const battery = telemetry?.battery ?? "--";
 const status = telemetry?.status ?? "--";
 const mast = telemetry?.mast ?? "--";
 const ms = Number.isFinite(latencyMs) ? `${latencyMs} ms` : "— ms";
 const imageDesc = snapshot?.description || telemetry?.currentTask || "—";

 return (
  <div className="screen">
   {/* CORREGIDO: onLogout para el menú de Header */}
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

   <section className="card">
    <h3>Logs de Actividad</h3>
    <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '12px', padding: '0 8px' }}>
     {logs.length === 0 ? (
      <p className="muted small">Esperando confirmaciones y eventos del robot...</p>
     ) : (
      logs.map(log => (
       <p key={log.id} style={{ color: log.type === 'error' ? 'tomato' : (log.type === 'ack' ? '#38b26b' : 'inherit'), margin: '4px 0' }}>
        <strong>[{new Date(log.timestamp).toLocaleTimeString()}]</strong>
        {log.type === 'ack' ? ' ✅ ACK:' : log.type === 'error' ? ' ❌ ERROR:' : ` [${log.type.toUpperCase()}]:`}
        {log.message || log.accion || log.status}
        {log.nonce && ` (Nonce: ${log.nonce.substring(0, 8)})`}
       </p>
      ))
     )}
    </div>
   </section>

   <section className="pad">
    {/* Botón Arriba (Adelante) */}
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
     {/* Botón Izquierda */}
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
     <button className="pad-btn pause" onClick={pause}>⏸</button>
     {/* Botón Derecha */}
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
    {/* Botón Abajo (Atrás) */}
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

   <div className="row two">
    {/* SUBIR TORRE */}
    <button className="btn"
     onPointerDown={startLift("lift_up")}
     onPointerUp={stopLift}
     onPointerCancel={stopLift}
     onPointerLeave={stopLift}
     disabled={isAuto} // ⬅️ DESHABILITAR en MODO AUTO
    >SUBIR TORRE</button>

    {/* BAJAR TORRE */}
    <button className="btn"
     onPointerDown={startLift("lift_down")}
     onPointerUp={stopLift}
     onPointerCancel={stopLift}
     onPointerLeave={stopLift}
     disabled={isAuto} // ⬅️ DESHABILITAR en MODO AUTO
    >BAJAR TORRE</button>
   </div>

   <div className="row two">
    {/* INCLINAR ARRIBA */}
    <button className="btn" onClick={tiltForward} disabled={isAuto}>INCLINAR ↑</button>

    {/* INCLINAR ABAJO */}
    <button className="btn" onClick={tiltBackward} disabled={isAuto}>INCLINAR ↓</button>
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
