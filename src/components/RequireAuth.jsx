import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!isAuthenticated || !user) {
        setChecking(false);
        return;
      }

      try {
        // 1️⃣ Verificar si el usuario existe
        let res = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth0Id: user.sub,
            email: user.email,
            name: user.name,
          }),
        });

        // 2️⃣ Si no existe, crearlo automáticamente
        if (res.status === 404) {
          await fetch("http://localhost:3000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              auth0Id: user.sub,
              email: user.email,
              name: user.name,
            }),
          });
        }

        // 3️⃣ Verificar acceso como operador
        const operatorCheck = await fetch("http://localhost:3000/api/auth/access-operator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth0Id: user.sub }),
        });

        // 4️⃣ Verificar acceso como admin
        const adminCheck = await fetch("http://localhost:3000/api/auth/access-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth0Id: user.sub }),
        });

        const opRes = await operatorCheck.json();
        const admRes = await adminCheck.json();

        // 5️⃣ Si alguna ruta lo acepta, concedemos acceso
        if (operatorCheck.status === 200 && opRes.user) {
          localStorage.setItem("userRole", opRes.user.role);
          localStorage.setItem("userData", JSON.stringify(opRes.user));
          setAccessGranted(true);
        } else if (adminCheck.status === 200 && admRes.user) {
          localStorage.setItem("userRole", admRes.user.role);
          localStorage.setItem("userData", JSON.stringify(admRes.user));
          setAccessGranted(true);
        } else {
          setAccessGranted(false);
        }
      } catch (err) {
        console.error("Error verificando acceso:", err);
        setAccessGranted(false);
      } finally {
        setChecking(false);
      }
    };

    verifyAccess();
  }, [isAuthenticated, user]);

  if (isLoading || checking) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh", fontSize: "20px" }}>
        Cargando autenticación...
      </div>
    );
  }

  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }

  if (!accessGranted) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", fontSize: "20px" }}>
        Acceso denegado: no tienes permisos para ingresar.
      </div>
    );
  }

  return <>{children}</>;
}
