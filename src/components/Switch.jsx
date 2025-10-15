import { useId } from "react";

export default function Switch({ checked, onChange, label = "On/OFF" }) {
  const id = useId();
  return (
    <label className={`sw ${checked ? "on" : ""}`} htmlFor={id} role="switch" aria-checked={checked}>
      <input
        id={id}
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: "none" }}
      />
      <span className="knob" />
      <span className="sw-label">{label}</span>
    </label>
  );
}
