// src/components/RequireAuth.jsx
import { useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function RequireAuth({ children }) {
  // BYPASS: si está activo, no pedimos login
  if (import.meta.env.VITE_BYPASS_AUTH === "true") {
    return children;
  }

  const { isAuthenticated, isLoading, loginWithRedirect, error } = useAuth0();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error && !redirectingRef.current) {
      redirectingRef.current = true;
      loginWithRedirect().catch(() => { redirectingRef.current = false; });
    }
  }, [isLoading, isAuthenticated, error, loginWithRedirect]);

  if (isLoading) return <div style={{ padding: 16 }}>Cargando…</div>;
  if (error) return <div style={{ padding: 16, color: "tomato" }}>
    Error de autenticación: {String(error.message || error)}
  </div>;
  if (!isAuthenticated) return null;

  return children;
}
