import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';


import { FaLeaf, FaStar, FaHome, FaMapMarkedAlt, FaTrophy, FaListOl, FaGift } from "react-icons/fa";

function Navbar({ user, onLogout }) {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">
            <FaLeaf size={24} color="#4CAF50" style={{ marginRight: "6px" }} />
          </span>
          <span className="logo-text">EcoMove</span>
        </Link>

        <div className="nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            <FaHome size={18} style={{ marginRight: "6px" }} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/mapa" 
            className={location.pathname === '/mapa' ? 'active' : ''}
          >
            <FaMapMarkedAlt size={18} style={{ marginRight: "6px" }} />
            <span>Mapa</span>
          </Link>
          <Link 
            to="/retos" 
            className={location.pathname === '/retos' ? 'active' : ''}
          >
            <FaTrophy size={18} style={{ marginRight: "6px" }} />
            <span>Retos</span>
          </Link>
          <Link 
            to="/ranking" 
            className={location.pathname === '/ranking' ? 'active' : ''}
          >
            <FaListOl size={18} style={{ marginRight: "6px" }} />
            <span>Ranking</span>
          </Link>
          <Link 
            to="/recompensas" 
            className={location.pathname === '/recompensas' ? 'active' : ''}
          >
            <FaGift size={18} style={{ marginRight: "6px" }} />
            <span>Recompensas</span>
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
                <FaStar size={16} color="#FFD700" style={{ marginRight: "4px" }} />
                {user.puntos} pts | Nivel {user.nivel}
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
