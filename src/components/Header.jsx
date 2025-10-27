// src/components/Header.jsx
import { useEffect, useState } from 'react';
import { LogOut, Home, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export default function Header({ title = "LiftCore", onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const { user } = useAuth0();

  // Evita múltiples requests a lh3.googleusercontent.com
  useEffect(() => {
    if (!user?.picture) { setAvatarUrl(null); return; }
    // Fuerza un tamaño fijo (cacheable) y evita que Auth0 pase variantes
    const fixed = user.picture.replace(/=s\d+(-c)?$/, "=s64-c");
    setAvatarUrl(fixed);
  }, [user?.picture]);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <header className="hc-header">
      {/* Izquierda: hamburguesa */}
      <button
        className="hc-iconbtn hc-menu-trigger"
        aria-label="Abrir menú"
        onClick={(e) => { e.stopPropagation(); toggleMenu(); }}
        type="button"
        aria-expanded={isMenuOpen}
      >
        <span className="hc-burger"><i /><i /><i /></span>
      </button>

      {/* Centro: título */}
      <div className="hc-title" aria-label={title}>{title}</div>

      {/* Derecha: avatar (no abre menú) */}
      <div className="hc-avatar-container" onClick={(e) => e.stopPropagation()}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name || "Usuario"}
            className="hc-avatar"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => { e.currentTarget.src = "/avatar-fallback.png"; }}
          />
        ) : (
          <div className="hc-avatar hc-avatar--fallback"><User size={20} /></div>
        )}
      </div>

      {/* Menú */}
      {isMenuOpen && (
        <>
          <div className="hc-overlay" onClick={toggleMenu} />
          <div className="hc-menu side" role="menu" aria-label="Menú principal">
            <div className="hc-profile-info">
              <span className="hc-profile-name">{user?.name || "Usuario"}</span>
              <span className="hc-profile-email">{user?.email}</span>
            </div>

            <Link
              to="/"
              className="hc-menu-item"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              <Home className="w-4 h-4" />
              Inicio
            </Link>

            <button
              className="hc-menu-item danger"
              onClick={handleLogoutClick}
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </>
      )}
    </header>
  );
}
