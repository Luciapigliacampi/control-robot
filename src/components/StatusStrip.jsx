export default function StatusStrip({ status, mode, battery, mast, latencyMs }) {
  const tone = latencyMs == null ? "badge" : latencyMs < 120 ? "badge ok" : latencyMs < 250 ? "badge warn" : "badge err";
  return (
    <div className="hstack">
      <span className="badge ok">SOS</span>
      <span className="small">Batería: <b>{battery ?? "--"}%</b></span>
      <span className="small">Estado: <b>{status ?? "--"}</b></span>
      <span className="small">Modo: <b>{mode ?? "--"}</b></span>
      <span className="small">Torre: <b>{mast ?? "--"}</b></span>
      <span className={tone}>{latencyMs ?? "—"} ms</span>
    </div>
  );
}
