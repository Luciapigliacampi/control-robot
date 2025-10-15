import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function ErrorPage() {
  const { logout } = useAuth0();

  useEffect(() => {

    const timer = setTimeout(() => {
      logout({ logoutParams: { returnTo: window.location.origin } });
    }, 15000);

    return () => clearTimeout(timer);
  }, [logout]);

  const handleLogout = (e) => {
    e.preventDefault();
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div className="container">
      <h1>Acceso Denegado</h1>
      <p>Email no autorizado para acceder a esta aplicación.</p>
      <p>Serás redirigido al inicio en 15 segundos.</p>
      <a
        href="/"
        style={{ color: "#007bff", textDecoration: "underline" }}
        onClick={handleLogout}
      >
        Volver al inicio ahora
      </a>
    </div>
  );
}