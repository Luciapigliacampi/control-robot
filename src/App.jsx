// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import ControlMobile from './pages/ControlMobile.jsx';
import Login from './pages/Login.jsx'; // Tu componente de login/home
import ErrorPage from './pages/ErrorPage.jsx';
import RequireAuth from './components/RequireAuth.jsx'; // <--- NUEVA IMPORTACIÓN

export default function App() {
  return (
    <Routes>
      <Route path="/" element={
        // Protegemos la ruta principal con RequireAuth
        <RequireAuth>
          <ControlMobile />
        </RequireAuth>
      } />
      
      {/* Rutas adicionales de Auth0 */}
      <Route path="/login" element={<Login />} />
      <Route path="/error" element={<ErrorPage />} />
      {/* Puedes manejar el access_denied si necesitas una ruta específica */}
      {/* <Route path="/access-denied" element={<ErrorPage />} /> */}
      
      {/* Ruta comodín para 404 */}
      <Route path="*" element={<h1>404: Página no encontrada</h1>} />
    </Routes>
  );
}