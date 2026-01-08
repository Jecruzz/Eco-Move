import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🌱</span>
          <span className="logo-text">EcoMove</span>
        </Link>

        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            <span>📊</span> Dashboard
          </Link>
          <Link 
            to="/mapa" 
            className={location.pathname === '/mapa' ? 'active' : ''}
          >
            <span>🗺️</span> Mapa
          </Link>
          <Link 
            to="/ranking" 
            className={location.pathname === '/ranking' ? 'active' : ''}
          >
            <span>🏆</span> Ranking
          </Link>
          <Link 
            to="/recompensas" 
            className={location.pathname === '/recompensas' ? 'active' : ''}
          >
            <span>🎁</span> Recompensas
          </Link>
        </div>

        <div className="nav-user">
          <Link to="/perfil" className="user-info">
            {user.imagen ? (
              <img src={`http://localhost:5000${user.imagen}`} alt={user.nombre} />
            ) : (
              <div className="user-avatar">{user.nombre.charAt(0)}</div>
            )}
            <div className="user-details">
              <span className="user-name">{user.nombre}</span>
              <span className="user-points">
                ⭐ {user.puntos} pts | Nivel {user.nivel}
              </span>
            </div>
          </Link>
          <button onClick={onLogout} className="btn-logout">
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;