import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const [accessGranted, setAccessGranted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!isAuthenticated || !user) {
        setChecking(false); // 👈 aseguramos que no quede en loop
        return;
      }

      try {
        let res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth0Id: user.sub,
            email: user.email,
            name: user.name,
          }),
        });

        if (res.status === 404) {
          await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              auth0Id: user.sub,
              email: user.email,
              name: user.name,
            }),
          });
        }

        const operatorCheck = await fetch(`${API_BASE}/api/auth/access-operator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auth0Id: user.sub }),
        });

        const adminCheck = await fetch(`${API_BASE}/api/auth/access-admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auth0Id: user.sub }),
        });

        const opRes = await operatorCheck.json();
        const admRes = await adminCheck.json();

        if (operatorCheck.status === 200 && opRes.user) {
          localStorage.setItem('userRole', opRes.user.role);
          localStorage.setItem('userData', JSON.stringify(opRes.user));
          setAccessGranted(true);
        } else if (adminCheck.status === 200 && admRes.user) {
          localStorage.setItem('userRole', admRes.user.role);
          localStorage.setItem('userData', JSON.stringify(admRes.user));
          setAccessGranted(true);
        } else {
          setAccessGranted(false);
        }
      } catch (err) {
        console.error('Error verificando acceso:', err);
        setAccessGranted(false);
      } finally {
        setChecking(false);
      }
    };

    // ✅ ejecutar siempre después de cargar Auth0
    if (!isLoading) {
      verifyAccess();
    }
  }, [isLoading, isAuthenticated, user]);

  // 🕐 Mientras Auth0 carga o estamos verificando acceso
  if (isLoading || checking) {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          height: '100vh',
          fontSize: '20px',
        }}
      >
        Cargando autenticación...
      </div>
    );
  }

  // 🔐 Si no está autenticado, redirigir
  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }

  // 🚫 Si no tiene permisos
  if (!accessGranted) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '20px' }}>
        Acceso denegado: no tienes permisos para ingresar.
      </div>
    );
  }

  // ✅ Acceso concedido
  return <>{children}</>;
}