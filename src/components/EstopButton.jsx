export default function EstopButton({ onClick }) {
  return (
    <button onClick={onClick} className="btn err" style={{position:"fixed",right:16,bottom:16,padding:"14px 18px",fontWeight:700}}>
      E-STOP
    </button>
  );
}
