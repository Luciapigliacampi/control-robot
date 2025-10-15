// src/components/PowerSwitch.jsx
import { useCallback } from "react";

// src/components/PowerSwitch.jsx
export default function PowerSwitch({ checked, onChange, disabled }) {
  return (
    <button
      className={`switch ${checked ? "on" : "off"} ${disabled ? "disabled" : ""}`}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.2)",
        background: checked ? "#4ade80" : "#374151",
        color: "#111",
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: 72,
        justifyContent: "space-between",
      }}
    >
      <span
        style={{
          width: 18, height: 18,
          borderRadius: "50%",
          background: "#fff"
        }}
      />
      <span style={{ color: "#fff", fontWeight: 600 }}>
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

