// src/components/ControlPad.jsx
import { Camera, MoveUp, MoveDown } from "lucide-react";

export default function ControlPad({ onCmd }) {
  // Mantiene el control continuo mientras se mantiene presionado
  const press = (dir) => () =>
    onCmd("move", {
      v:
        dir === "adelante" ? 0.5 :
        dir === "atras"     ? -0.5 : 0,
      omega:
        dir === "izquierda" ? -0.4 :
        dir === "derecha"   ?  0.4 : 0,
    });

  const stop = () => onCmd("move", { v: 0, omega: 0 });

  return (
    <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {/* Fila superior: vacío / arriba / cámara */}
      <div />
      <button className="btn" onMouseDown={press("adelante")} onMouseUp={stop}>▲</button>
      <button
        className="btn"
        onClick={() => onCmd("capture_image", {})}
        title="Capturar imagen"
      >
        <Camera size={18} />
      </button>

      {/* Fila media: izquierda / atrás / derecha */}
      <button className="btn" onMouseDown={press("izquierda")} onMouseUp={stop}>◀</button>
      <button className="btn" onMouseDown={press("atras")} onMouseUp={stop}>▼</button>
      <button className="btn" onMouseDown={press("derecha")} onMouseUp={stop}>▶</button>

      {/* Torre: subir / bajar con íconos Lucide */}
      <button className="btn" onClick={() => onCmd("fork", { deltaMm: 50 })}>
        <MoveUp />
      </button>
      <div />
      <button className="btn" onClick={() => onCmd("fork", { deltaMm: -50 })}>
        <MoveDown />
      </button>
    </div>
  );
}
