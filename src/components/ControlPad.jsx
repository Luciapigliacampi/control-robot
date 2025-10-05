export default function ControlPad({ onCmd }) {
  const press = (dir) => () => onCmd("move", { v: dir==="adelante"?0.5:dir==="atras"?-0.5:0, omega: dir==="izquierda"?-0.4:dir==="derecha"?0.4:0 });
  const stop  = () => onCmd("move", { v:0, omega:0 });

  return (
    <div className="grid" style={{gridTemplateColumns:"repeat(3,1fr)", gap:8}}>
      <div/>
      <button className="btn" onMouseDown={press("adelante")} onMouseUp={stop}>▲</button>
      <div/>
      <button className="btn" onMouseDown={press("izquierda")} onMouseUp={stop}>◀</button>
      <button className="btn" onMouseDown={press("atras")} onMouseUp={stop}>▼</button>
      <button className="btn" onMouseDown={press("derecha")} onMouseUp={stop}>▶</button>
      <button className="btn" onClick={()=>onCmd("fork", { deltaMm: 50 })}>SUBIR TORRE</button>
      <button className="btn" onClick={()=>onCmd("fork", { deltaMm: -50 })}>BAJAR TORRE</button>
    </div>
  );
}
