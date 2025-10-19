import { useState } from 'react';
// Importamos 'Link' en lugar de 'useNavigate'
import { LogOut, Home } from 'lucide-react'; 
import { Link } from 'react-router-dom'; 

export default function Header({ title = "LiftCore", onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Eliminamos: const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  
  // Función para manejar el clic en "Cerrar Sesión"
  const handleLogoutClick = () => {
    setIsMenuOpen(false); // Cierra el menú
    if (onLogout) {
      onLogout(); // Llama a la función de logout proporcionada por props (desde ControlMobile)
    }
  };

  // Eliminamos handleHomeClick y usamos <Link> directamente.

  return (
    <header className="hc-header">
      <div className="hc-left">
        <div className="hc-avatar hc-avatar--placeholder" />
      </div>
      <div className="hc-title" aria-label={title}>{title}</div>
      
      {/* Botón de Hamburguesa que ahora maneja la apertura del menú */}
      <button 
        className="hc-iconbtn" 
        aria-label="Abrir menú" 
        onClick={(e) => {
          e.stopPropagation(); // Evita que el evento burbujee
          toggleMenu(); 
        }}
        type="button"
        aria-expanded={isMenuOpen}
      >
        <span className="hc-burger"><i /><i /><i /></span>
      </button>

      {/* Menú Desplegable Condicional */}
      {isMenuOpen && (
        <div className="hc-menu">
          
          {/* Usamos Link para la navegación a Inicio */}
          <Link 
            to="/" // La ruta raíz donde está tu aplicación
            className="hc-menu-item" 
            onClick={() => setIsMenuOpen(false)} // Cerrar menú al navegar
          >
            <Home className="w-4 h-4" />
            Inicio
          </Link>
          
          <button className="hc-menu-item" onClick={handleLogoutClick}>
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </header>
  );
}
