import { useRef, useState, useEffect } from "react";

export default function Joystick({ onVector }) {
  const areaRef = useRef(null);
  const [pos, setPos] = useState({ x:0, y:0 });

  useEffect(() => {
    const t = setInterval(()=> onVector({ v: -pos.y, omega: pos.x }), 100); // ~10 msg/seg
    return ()=> clearInterval(t);
  }, [pos, onVector]);

  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
  const handle = (e) => {
    const r = areaRef.current.getBoundingClientRect();
    const cx=r.left+r.width/2, cy=r.top+r.height/2;
    const p = e.touches?e.touches[0]:e;
    const nx = clamp((p.clientX-cx)/(r.width/2), -1, 1);
    const ny = clamp((p.clientY-cy)/(r.width/2), -1, 1);
    setPos({ x:nx, y:ny });
  };
  const end = ()=> setPos({ x:0, y:0 });

  return (
    <div ref={areaRef}
      onMouseMove={(e)=>e.buttons===1 && handle(e)}
      onMouseDown={handle} onMouseUp={end} onMouseLeave={end}
      onTouchStart={handle} onTouchMove={handle} onTouchEnd={end}
      style={{width:180,height:180,borderRadius:"50%",background:"#0b1225",border:"1px solid var(--border)",margin:"0 auto",position:"relative",touchAction:"none"}}>
      <div style={{width:48,height:48,borderRadius:"50%",background:"#999",position:"absolute",
        left:`calc(50% + ${pos.x*70}px - 24px)`, top:`calc(50% + ${pos.y*70}px - 24px)`}}/>
    </div>
  );
}
