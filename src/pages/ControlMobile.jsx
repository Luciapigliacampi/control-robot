import { useEffect, useState, useCallback } from "react";
import useWS from "../hooks/useWS.js";
import Hamburger from "../components/Hamburger.jsx";
import StatusStrip from "../components/StatusStrip.jsx";
import StepList from "../components/StepList.jsx";
import ControlPad from "../components/ControlPad.jsx";
import Joystick from "../components/Joystick.jsx";
import EstopButton from "../components/EstopButton.jsx";

export default function ControlMobile() {
  const robotId = "R1"; // o seleccionable si tienen múltiples
  const { connected, latencyMs, telemetry, snapshot, steps, setSteps, sendControl, setMode, requestPhoto } = useWS();

  const [mode, setLocalMode] = useState("manual");
  const [useJoystick, setUseJoystick] = useState(false);

  useEffect(() => { if (telemetry?.mode) setLocalMode(telemetry.mode); }, [telemetry?.mode]);

  const toggleMode = () => {
    const next = mode === "auto" ? "manual" : "auto";
    setLocalMode(next);
    setMode(next, robotId);
  };

  const onCmd = useCallback((cmd, args) => sendControl(cmd, args, robotId), [sendControl]);

  // joystick → envía vector continuo
  const onVector = useCallback(({ v, omega }) => {
    onCmd("move", { v: Math.round(v*100)/100, omega: Math.round(omega*100)/100 });
  }, [onCmd]);

  function addStep(){ const id = crypto.randomUUID(); setSteps(prev=>[...prev,{id,text:"Nuevo paso",done:false}]); }
  function toggleStep(id){ setSteps(prev=>prev.map(s=>s.id===id?({...s,done:!s.done}):s)); }
  function clearSteps(){ setSteps([]); }

  return (
    <div className="vstack">
      {/* Top */}
      <div className="mobile-top">
        <div className="hstack"><Hamburger onClick={()=>alert("Menú")} /><strong>LiftCore</strong></div>
        <StatusStrip battery={telemetry?.battery} weightKg={telemetry?.weightKg} latencyMs={latencyMs}/>
      </div>

      {/* Tabs + acciones */}
      <div className="tabbar">
        <button className={`btn tab ${mode==="auto"?"primary":""}`} onClick={toggleMode}>Automático</button>
        <button className={`btn tab ${mode==="manual"?"primary":""}`} onClick={toggleMode}>Manual</button>
        <button className="btn" onClick={()=>requestPhoto(robotId)}>📷</button>
      </div>

      {/* Ruta autonoma */}
      <div className="card vstack">
        <h3 style={{margin:0}}>Ruta Autónoma</h3>
        <div className="hstack" style={{gap:8}}>
          <button className="btn primary" onClick={()=>onCmd("move",{v:0.3,omega:0})}>Iniciar</button>
          <button className="btn" onClick={()=>onCmd("move",{v:0,omega:0})}>Finalizar</button>
        </div>
        <span className="small">WS: {connected?"Conectado":"Cortado"}</span>
      </div>

      {/* Percepción + Pasos */}
      <div className="grid grid-2">
        <div className="card vstack">
          <h3 style={{margin:0}}>Percepción</h3>
          <div className="snapshot">
            {snapshot?.snapshotUrl ? <img src={snapshot.snapshotUrl} alt="Última captura" style={{width:"100%"}}/> : <span className="small">Sin imagen</span>}
          </div>
          <div className="small">Último QR: {telemetry?.lastQr ?? "—"}</div>
        </div>

        <StepList steps={steps} onToggle={toggleStep} onAdd={addStep} onClear={clearSteps}/>
      </div>

      {/* Controles: joystick o pad */}
      <div className="hstack" style={{justifyContent:"space-between"}}>
        <div className="hstack">
          <button className="btn" onClick={()=>setUseJoystick(false)} disabled={!useJoystick}>Botones</button>
          <button className="btn" onClick={()=>setUseJoystick(true)} disabled={useJoystick}>Joystick</button>
        </div>
        <div className="hstack">
          <button className="btn" onClick={()=>onCmd("fork",{deltaMm:50})}>Fork +50</button>
          <button className="btn" onClick={()=>onCmd("fork",{deltaMm:-50})}>Fork -50</button>
        </div>
      </div>

      {useJoystick ? <Joystick onVector={onVector}/> : <ControlPad onCmd={onCmd} />}

      {/* Bottom nav (decorativo/MVP) */}
      <div className="bottom-nav">
        <button className="btn">🏠</button>
        <button className="btn">⏺</button>
        <button className="btn">≡</button>
        <button className="btn">❗</button>
      </div>

      <EstopButton onClick={()=>onCmd("estop")} />
    </div>
  );
}
