export default function StatusStrip({ battery, weightKg, latencyMs }) {
  const tone = latencyMs == null ? "badge" : latencyMs < 120 ? "badge ok" : latencyMs < 250 ? "badge warn" : "badge err";
  return (
    <div className="hstack">
      <span className="badge ok">SOS</span>
      <span className="small">Batería: <b>{battery ?? "--"}%</b></span>
      <span className="small">Carga: <b>{weightKg ?? 0} kg</b></span>
      <span className={tone}> {latencyMs ?? "—"} ms</span>
    </div>
  );
}
