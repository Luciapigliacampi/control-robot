// /*
// export default function StepList({ steps = [], onToggle, onAdd, onClear }) {
//   return (
//     <div className="card vstack">
//       <div className="hstack" style={{justifyContent:"space-between"}}>
//         <h3 style={{margin:0}}>Siguientes pasos</h3>
//         <div className="hstack">
//           <button className="btn" onClick={onClear}>🗑️</button>
//           <button className="btn" onClick={onAdd}>＋</button>
//         </div>
//       </div>
//       <ul style={{listStyle:"none", padding:0, margin:0, display:"grid", gap:8}}>
//         {steps.map((s) => (
//           <li key={s.id} className="hstack" style={{justifyContent:"space-between"}}>
//             <span>{s.text}</span>
//             <input type="checkbox" checked={!!s.done} onChange={() => onToggle(s.id)} />
//           </li>
//         ))}
//         {!steps.length && <li className="small">Sin pasos</li>}
//       </ul>
//     </div>
//   );
// }
// */

// // Componente deshabilitado temporalmente por pedido: ocultar sección de pasos.
// export default function StepList(){ return null }
