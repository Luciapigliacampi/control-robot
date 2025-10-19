// src/components/RequireAuth.jsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
// Asegúrate de tener un componente Spinner si lo usas
// import Spinner from './Spinner.jsx'; 
import ErrorPage from '../pages/ErrorPage.jsx'; // Para manejar 'access_denied'

/**
 * Componente de orden superior que requiere autenticación.
 * Muestra el contenido hijo solo si el usuario está autenticado.
 */
export default function RequireAuth({ children }) {
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    loginWithRedirect 
  } = useAuth0();

  // 1. Manejo del Estado de Carga (Spinner)
  if (isLoading) {
    // Si está cargando, muestra un mensaje o spinner
    return <div style={{ 
      display: 'grid', 
      placeItems: 'center', 
      height: '100vh', 
      fontSize: '20px'
    }}>Cargando autenticación...</div>;
    // return <Spinner />;
  }

  // 2. Manejo de Errores (Access Denied)
  if (error && error.error === 'access_denied') {
    // Si Auth0 devuelve 'access_denied' (como se especifica en la doc ),
    // redirige a la página de error.
    return <ErrorPage error={error} />; 
  }
  
  // 3. Manejo de Falta de Autenticación
  if (!isAuthenticated) {
    // Si el usuario no está logueado, inicia el flujo de redirección
    // al proveedor de identidad (Auth0).
    loginWithRedirect();
    // Mientras la redirección ocurre, no renderizamos nada
    return null; 
  }

  // 4. Autenticación Exitosa: Renderiza el contenido hijo (ControlMobile)
  return <>{children}</>;
}