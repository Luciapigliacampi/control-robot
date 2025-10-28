import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import ErrorPage from "../pages/ErrorPage.jsx";

export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user, error } = useAuth0();
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false); // <--- nuevo estado

  useEffect(() => {
    if (isAuthenticated && user) {
      // Llamada al backend: login o registro automático
      fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id: user.sub, name: user.name, email: user.email })
      })
        .then(async res => {
          const data = await res.json();
          if (res.status === 404) {
            // Si no existe, registramos automáticamente
            return fetch("http://localhost:3000/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ auth0Id: user.sub, name: user.name, email: user.email })
            }).then(r => r.json());
          }
          return data;
        })
        .then(data => {
          // Verificamos rol
          if (data.user?.role === "operator") {
            setAccessGranted(true);
            setIsAdminUser(false);
          } else if (data.user?.role === "admin") {
            // Si es admin, marcamos para mostrar ErrorPage
            setAccessGranted(false);
            setIsAdminUser(true);
          } else {
            setAccessGranted(false);
            setIsAdminUser(false);
          }
        })
        .catch(err => {
          console.error("Error verificando/registrando usuario:", err);
          setAccessGranted(false);
          setIsAdminUser(false);
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading || checking) {
    return <div style={{ display: "grid", placeItems: "center", height: "100vh", fontSize: "20px" }}>
      Cargando autenticación...
    </div>;
  }

  if (error && error.error === "access_denied") {
    return <ErrorPage error={error} />;
  }

  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }

  // Si fue identificado como admin, mostrar la página de error
  if (isAdminUser) {
    return <ErrorPage error={{ message: "Acceso denegado: usuarios con rol 'admin' no pueden ingresar aquí." }} />;
  }

  if (!accessGranted) {
    return <div style={{ textAlign: "center", marginTop: "50px", fontSize: "20px" }}>
      Acceso denegado: no tienes permisos para ingresar.
    </div>;
  }

  return <>{children}</>;
}
