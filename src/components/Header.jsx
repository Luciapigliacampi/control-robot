export default function Header({ title = "LiftCore", onMenu }) {
  return (
    <header className="hc-header">
      <div className="hc-left">
        <div className="hc-avatar hc-avatar--placeholder" />
      </div>
      <div className="hc-title" aria-label={title}>{title}</div>
      <button className="hc-iconbtn" aria-label="Abrir menú" onClick={onMenu} type="button">
        <span className="hc-burger"><i /><i /><i /></span>
      </button>
    </header>
  );
}
