// src/components/Header.jsx
import { useEffect, useState } from 'react';
import { LogOut, Home, User, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Header({ title = 'Bottype', onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const { user } = useAuth0();
  const [isAdmin, setIsAdmin] = useState(false);

  // se asigna el rol tradio desde local store a una variable
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'admin') setIsAdmin(true);
  }, []);

  // Evita múltiples requests a lh3.googleusercontent.com
  useEffect(() => {
    if (!user?.picture) {
      setAvatarUrl(null);
      return;
    }
    // Fuerza un tamaño fijo (cacheable) y evita que Auth0 pase variantes
    const fixed = user.picture.replace(/=s\d+(-c)?$/, '=s64-c');
    setAvatarUrl(fixed);
  }, [user?.picture]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    if (onLogout) onLogout();
    //limpio local storage
    localStorage.removeItem('dashboardToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('auth0Id');
    localStorage.removeItem('email');
  };
  const goToDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auth0Id: user.sub })
      });
      const data = await res.json();
      if (res.ok) {
        // Guardamos token en localStorage antes de ir
        localStorage.setItem('dashboardToken', data.token);
        window.location.href = `https://adm-robot.vercel.app/?token=${data.token}`;
      } else {
        console.error('No se pudo generar token:', data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <header className='hc-header'>
      {/* Izquierda: hamburguesa */}
      <button
        className='hc-iconbtn hc-menu-trigger'
        aria-label='Abrir menú'
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}
        type='button'
        aria-expanded={isMenuOpen}
      >
        <span className='hc-burger'>
          <i />
          <i />
          <i />
        </span>
      </button>

      {/* Centro: título */}
      <div className='hc-title' aria-label={title}>
        {title}
      </div>

      {/* Derecha: avatar (no abre menú) */}
      <div className='hc-avatar-container' onClick={(e) => e.stopPropagation()}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name || 'Usuario'}
            className='hc-avatar'
            loading='lazy'
            decoding='async'
            referrerPolicy='no-referrer'
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => {
              e.currentTarget.src = '/avatar-fallback.png';
            }}
          />
        ) : (
          <div className='hc-avatar hc-avatar--fallback'>
            <User size={20} />
          </div>
        )}
      </div>

      {/* Menú */}
      {isMenuOpen && (
        <>
          <div className='hc-overlay' onClick={toggleMenu} />
          <div className='hc-menu side' role='menu' aria-label='Menú principal'>
            <div className='hc-profile-info'>
              <span className='hc-profile-name'>{user?.name || 'Usuario'}</span>
              <span className='hc-profile-email'>{user?.email}</span>
            </div>

            {/* <Link
              to="/"
              className="hc-menu-item"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              <Home className="w-4 h-4" />
              Inicio
            </Link> */}
            {/* 🔹 Solo visible para admin */}
            {isAdmin && (
              <button
                className='hc-menu-item'
                onClick={goToDashboard}
                role='menuitem'
              >
                <LayoutDashboard className='w-4 h-4' />
                Ir al Dashboard
              </button>
            )}
            <button
              className='hc-menu-item danger'
              onClick={handleLogoutClick}
              role='menuitem'
            >
              <LogOut className='w-4 h-4' />
              Cerrar Sesión
            </button>
          </div>
        </>
      )}
    </header>
  );
}
