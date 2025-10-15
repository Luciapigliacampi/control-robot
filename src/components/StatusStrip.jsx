// src/components/StatusStrip.jsx
export default function StatusStrip({
  battery = "--",
  status = "--",
  mode = "--",
  mast = "--",
  latencyMs = null,
  onSos,
}) {
  const ms = Number.isFinite(latencyMs) ? `${latencyMs} ms` : "— ms";

  return (
    <div className="status-strip">
      <button type="button" className="chip ok" onClick={onSos}>SOS</button>
      <span>Batería: <strong>{battery}%</strong></span>
      <span>Estado: <strong>{status}</strong></span>
      <span>Modo: <strong>{mode}</strong></span>
      <span>Torre: <strong>{mast}</strong></span>
      <span className="chip">{ms}</span>
    </div>
  );
}
