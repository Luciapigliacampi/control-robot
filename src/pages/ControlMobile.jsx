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
    const {
        connected, latencyMs, telemetry, snapshot, steps, setSteps,
        sendControl, setMode, requestPhoto
    } = useWS();

    const [mode, setLocalMode] = useState("manual");
    const [useJoystick, setUseJoystick] = useState(false);

    useEffect(() => { if (telemetry?.mode) setLocalMode(telemetry.mode); }, [telemetry?.mode]);

    // Cambia modo -> task: change_mode
    const toggleMode = () => {
        const next = mode === "auto" ? "manual" : "auto";
        setLocalMode(next);
        setMode(next, robotId);
    };

    // --- MAPEO: PAD (tu ControlPad viejo llama "move" y "fork") ---
    const onPadCmd = useCallback((cmd, args = {}) => {
        if (cmd === "move") {
            const { v = 0, omega = 0 } = args;
            if (v > 0) return sendControl("move_forward", { value: 20 }, robotId);
            if (v < 0) return sendControl("move_backward", { value: 20 }, robotId);
            if (omega > 0) return sendControl("turn_right", {}, robotId);
            if (omega < 0) return sendControl("turn_left", {}, robotId);
            return sendControl("stop", {}, robotId);
        }
        if (cmd === "fork") {
            const { deltaMm = 0 } = args;
            if (deltaMm > 0) return sendControl("lift_up", {}, robotId);
            if (deltaMm < 0) return sendControl("lift_down", {}, robotId);
            return sendControl("lift_stop", {}, robotId);
        }
    }, [sendControl]);

    // --- MAPEO: JOYSTICK a tasks discretas ---
    const onVector = useCallback(({ v, omega }) => {
        const T = 0.2; // umbral
        if (Math.abs(v) > Math.abs(omega)) {
            if (v > T) return sendControl("move_forward", { value: 10 }, robotId);
            if (v < -T) return sendControl("move_backward", { value: 10 }, robotId);
        } else {
            if (omega > T) return sendControl("turn_degrees", { value: 10 }, robotId);
            if (omega < -T) return sendControl("turn_degrees", { value: -10 }, robotId);
        }
        return sendControl("stop", {}, robotId);
    }, [sendControl]);

    function addStep() {
        const id = crypto.randomUUID();
        setSteps(prev => [...prev, { id, text: "Nuevo paso", done: false }]);
    }
    function toggleStep(id) { setSteps(prev => prev.map(s => s.id === id ? ({ ...s, done: !s.done }) : s)); }
    function clearSteps() { setSteps([]); }

    // arriba de la función return, después de los hooks:
    const power = telemetry?.power ?? "on"; // default "on" si no llega
    const togglePower = () => {
        const next = power === "on" ? "off" : "on";
        // enviamos una task discreta por WS
        sendControl(next === "on" ? "power_on" : "power_off", {}, robotId);
    };



    return (
        <div className="vstack">
            {/* Top */}
            <div className="mobile-top">
                <div className="hstack"><Hamburger onClick={() => alert("Menú")} /><strong>LiftCore</strong></div>
                <StatusStrip
                    status={telemetry?.status}
                    mode={telemetry?.mode}
                    battery={telemetry?.battery}
                    mast={telemetry?.mast}
                    latencyMs={latencyMs}
                />
            </div>

            {/* Tabs + acciones */}
            <div className="tabbar">
                <button className={`btn tab ${mode === "auto" ? "primary" : ""}`} onClick={toggleMode}>Automático</button>
                <button className={`btn tab ${mode === "manual" ? "primary" : ""}`} onClick={toggleMode}>Manual</button>

                {/* NUEVO: Encender/Apagar */}
                <button
                    className="btn"
                    onClick={togglePower}
                    title={power === "on" ? "Apagar robot" : "Encender robot"}
                    style={{ marginLeft: 8 }}
                >
                    {power === "on" ? "Apagar" : "Encender"}
                </button>

                <button className="btn" onClick={() => sendControl("capture_image", {}, robotId)}>📷</button>

            </div>


            {/* Ruta autónoma */}
            <div className="card vstack">
                <h3 style={{ margin: 0 }}>Ruta Autónoma</h3>
                <div className="hstack" style={{ gap: 8 }}>
                    <button className="btn primary" onClick={() => sendControl("load", {}, robotId)}>Iniciar</button>
                    <button className="btn" onClick={() => sendControl("unload", {}, robotId)}>Finalizar</button>
                </div>
                <span className="small">WS: {connected ? "Conectado" : "Cortado"}</span>
            </div>

            {/* Percepción + Pasos */}
            <div className="grid grid-2">
                <div className="card vstack">
                    <h3 style={{ margin: 0 }}>Percepción</h3>
                    <div className="snapshot">
                        {snapshot?.snapshotUrl
                            ? <img src={snapshot.snapshotUrl} alt="Última captura" style={{ width: "100%" }} />
                            : <span className="small">Sin imagen</span>}
                    </div>
                    <div className="small">Tarea actual: {telemetry?.currentTask ?? "—"}</div>
                </div>

                <StepList steps={steps} onToggle={toggleStep} onAdd={addStep} onClear={clearSteps} />
            </div>

            {/* Controles: joystick o pad */}
            <div className="hstack" style={{ justifyContent: "space-between" }}>
                <div className="hstack">
                    <button className="btn" onClick={() => setUseJoystick(false)} disabled={!useJoystick}>Botones</button>
                    <button className="btn" onClick={() => setUseJoystick(true)} disabled={useJoystick}>Joystick</button>
                </div>
                <div className="hstack">
                    <button
                        className="btn"
                        onMouseDown={() => sendControl("lift_up", {}, robotId)}
                        onMouseUp={() => sendControl("lift_stop", {}, robotId)}
                        onTouchStart={() => sendControl("lift_up", {}, robotId)}
                        onTouchEnd={() => sendControl("lift_stop", {}, robotId)}
                    >
                        Fork +
                    </button>

                    <button
                        className="btn"
                        onMouseDown={() => sendControl("lift_down", {}, robotId)}
                        onMouseUp={() => sendControl("lift_stop", {}, robotId)}
                        onTouchStart={() => sendControl("lift_down", {}, robotId)}
                        onTouchEnd={() => sendControl("lift_stop", {}, robotId)}
                    >
                        Fork −
                    </button>
                </div>

            </div>

            {useJoystick ? <Joystick onVector={onVector} /> : <ControlPad onCmd={onPadCmd} />}

            {/* Bottom nav (decorativo/MVP) */}
            {/* <div className="bottom-nav">
        <button className="btn">🏠</button>
        <button className="btn">⏺</button>
        <button className="btn">≡</button>
        <button className="btn">❗</button>
      </div> */}

            {/* E-STOP -> stop */}
            <EstopButton onClick={() => sendControl("stop", {}, robotId)} />
        </div>
    );
}
