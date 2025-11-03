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

  // === FIX B: clase is-pressing controlada por JS ===
  const pressStart = (dir) => (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("is-pressing");
    press(dir)(); // llama a tu lógica continua
  };
  const pressEnd = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("is-pressing");
    stop(); // suelta
  };

 return (
  <div
    className="grid no-select"
    style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}
    onContextMenu={(e) => e.preventDefault()}
  >
      {/* Fila superior: vacío / arriba / cámara */}
      <div />
      <button className="btn pad-btn" onPointerDown={pressStart("adelante")} onPointerUp={pressEnd} onPointerLeave={pressEnd} onPointerCancel={pressEnd} aria-label="Mover hacia adelante">▲</button>
      <button
        className="btn pad-btn camera"
        onClick={() => onCmd("capture_image", {})}
        title="Capturar imagen"
        aria-label="Capturar imagen"
      >
        <Camera size={18} />
      </button>

      {/* Fila media: izquierda / atrás / derecha */}
      <button
        className="btn pad-btn"
        onPointerDown={pressStart("izquierda")}
        onPointerUp={pressEnd}
        onPointerLeave={pressEnd}
        onPointerCancel={pressEnd}
        aria-label="Girar izquierda"
      >
        ◀
      </button>

      <button
        className="btn pad-btn"
        onPointerDown={pressStart("atras")}
        onPointerUp={pressEnd}
        onPointerLeave={pressEnd}
        onPointerCancel={pressEnd}
        aria-label="Mover hacia atrás"
      >
        ▼
      </button>

      <button
        className="btn pad-btn"
        onPointerDown={pressStart("derecha")}
        onPointerUp={pressEnd}
        onPointerLeave={pressEnd}
        onPointerCancel={pressEnd}
        aria-label="Girar derecha"
      >
        ▶
      </button>
    </div>
  );
}
