import { useState } from 'react';
import { LogOut, Home, User } from 'lucide-react'; 
import { Link } from 'react-router-dom'; 
import { useAuth0 } from '@auth0/auth0-react'; 

export default function Header({ title = "LiftCore", onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useAuth0();

    const toggleMenu = () => setIsMenuOpen(prev => !prev);
    
    const handleLogoutClick = () => {
        setIsMenuOpen(false);
        if (onLogout) {
            onLogout();
        }
    };

    return (
        <header className="hc-header">
            {/* 1. SECCIÓN IZQUIERDA: BOTÓN DE MENÚ */}
            {/* Este botón ahora está en la primera columna de la rejilla (grid-column: 1) */}
            <button 
                className="hc-iconbtn hc-menu-trigger" 
                aria-label="Abrir menú" 
                onClick={(e) => {
                    e.stopPropagation(); 
                    toggleMenu(); 
                }}
                type="button"
                aria-expanded={isMenuOpen}
            >
                <span className="hc-burger"><i /><i /><i /></span>
            </button>
            
            {/* 2. SECCIÓN CENTRAL: TÍTULO (grid-column: 2) */}
            <div className="hc-title" aria-label={title}>{title}</div>
            
            {/* 3. SECCIÓN DERECHA: FOTO DE PERFIL (grid-column: 3) */}
            {/* Este botón no abre el menú, simplemente ocupa su lugar en la rejilla. 
               El menú de usuario se abre desde el botón de la izquierda. */}
            <div className="hc-avatar-container" onClick={(e) => e.stopPropagation()}>
                {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="hc-avatar" />
                ) : (
                    <div className="hc-avatar hc-avatar--fallback">
                        <User size={20} />
                    </div>
                )}
            </div>

            {/* Menú Desplegable Condicional */}
            {isMenuOpen && (
                <>
                    {/* Overlay para cerrar el menú al hacer clic fuera */}
                    <div className="hc-overlay" onClick={toggleMenu} /> 
                    
                    <div className="hc-menu side"> 
                        {/* Info de Usuario dentro del menú */}
                        <div className="hc-profile-info">
                            <span className="hc-profile-name">{user?.name || "Usuario"}</span>
                            <span className="hc-profile-email">{user?.email}</span>
                        </div>

                        {/* Link a Inicio */}
                        <Link 
                            to="/" 
                            className="hc-menu-item" 
                            onClick={() => setIsMenuOpen(false)} 
                        >
                            <Home className="w-4 h-4" />
                            Inicio
                        </Link>
                        
                        {/* Botón Cerrar Sesión */}
                        <button className="hc-menu-item danger" onClick={handleLogoutClick}>
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                        </button>
                    </div>
                </>
            )}
        </header>
    );
}