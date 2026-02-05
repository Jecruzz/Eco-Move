import { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfileModal.css';
import { FaStar, FaBullseye, FaGlobeAmericas, FaBicycle, FaMedal, FaTimes, FaFire } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

const MEDALLA_COLORES = {
  "Guardián del Planeta": "#4CAF50",
  "Héroe del Clima": "#2E7D32",
  "Campeón de la Tierra": "#1B5E20",
  "Ciclista Urbano": "#2196F3",
  "Explorador Sostenible": "#1976D2",
  "Leyenda de la Movilidad": "#0D47A1",
  "Maratonista Verde": "#FF9800",
  "Viajero incansable": "#F57C00",
  "Globetrotter Ecológico": "#E65100",
  "Elite Sostenible": "#9C27B0",
  "Maestro EcoMove": "#7B1FA2",
  "Leyenda Verde": "#4A148C",
  "Recolector de Puntos": "#FFC107",
  "Acumulador Experto": "#FFB300",
  "Rey de las Recompensas": "#FFD700",
  "Primer Paso Verde": "#009688",
  "Semana Sostenible": "#00695C",
  "Mes de Impacto": "#004D40"
};

const TRANSPORT_INFO = {
  bicicleta: { name: 'Bicicleta', color: '#4CAF50' },
  caminata: { name: 'Caminata', color: '#2196F3' },
  transporte_publico: { name: 'Transporte Público', color: '#FF9800' },
  carpooling: { name: 'Carpooling', color: '#9C27B0' },
  scooter: { name: 'Scooter', color: '#F44336' }
};

function UserProfileModal({ userId, onClose }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPerfil();
  }, [userId]);

  const cargarPerfil = async () => {
    try {
      const res = await axios.get(`${API_URL}/usuarios/${userId}`);
      setUserData(res.data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>No se pudo cargar el perfil</p>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  const progresoPorcentaje = ((userData.puntos % 100) / 100) * 100;
  const puntosParaSiguienteNivel = 100 - (userData.puntos % 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes size={14} />
        </button>

        <div className="modal-header">
          {userData.imagen ? (
            <img
              src={`http://localhost:5000${userData.imagen}`}
              alt={userData.nombre}
              className="modal-avatar"
            />
          ) : (
            <div className="modal-avatar-placeholder">{userData.nombre.charAt(0)}</div>
          )}
          
          <h2>{userData.nombre}</h2>
          
          <div className="modal-racha">
            <FaFire size={20} color="#FF5722" />
            <span>{userData.rachaDias || 0} días de racha</span>
          </div>
        </div>

        <div className="modal-stats-grid">
          <div className="modal-stat-card">
            <div className="stat-icon">
              <FaStar size={24} color="#FFD700" />
            </div>
            <div className="stat-info">
              <h3>{userData.puntos}</h3>
              <p>Puntos</p>
            </div>
          </div>

          <div className="modal-stat-card">
            <div className="stat-icon">
              <FaBullseye size={24} color="#eb0000ff" />
            </div>
            <div className="stat-info">
              <h3>Nivel {userData.nivel}</h3>
              <p>{puntosParaSiguienteNivel} pts al siguiente</p>
            </div>
          </div>

          <div className="modal-stat-card">
            <div className="stat-icon">
              <FaGlobeAmericas size={24} color="#1100ffff" />
            </div>
            <div className="stat-info">
              <h3>{userData.co2Ahorrado?.toFixed(1)} kg</h3>
              <p>CO₂ Ahorrado</p>
            </div>
          </div>

          <div className="modal-stat-card">
            <div className="stat-icon">
              <FaBicycle size={24} color="#000000ff" />
            </div>
            <div className="stat-info">
              <h3>{userData.stats?.totalViajes || 0}</h3>
              <p>Viajes</p>
            </div>
          </div>
        </div>

        <div className="modal-level-progress">
          <div className="progress-info">
            <span>Nivel {userData.nivel}</span>
            <span>{userData.puntos % 100}/100 pts</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progresoPorcentaje}%` }}
            ></div>
          </div>
        </div>

        {userData.medallas && userData.medallas.length > 0 && (
          <div className="modal-medallas">
            <h3>
              <FaMedal size={18} color="#FFD700" style={{ marginRight: '8px' }} />
              Logros
            </h3>
            <div className="medallas-grid">
              {userData.medallas.map((medalla, index) => (
                <div 
                  key={index} 
                  className="medalla-badge"
                  style={{ background: MEDALLA_COLORES[medalla] || "#9E9E9E" }}
                >
                  <span>{medalla}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {userData.porTipo && userData.porTipo.length > 0 && (
          <div className="modal-transport-stats">
            <h3>Medios de Transporte</h3>
            <div className="transport-list">
              {userData.porTipo.map((tipo) => (
                <div key={tipo._id} className="transport-item">
                  <div 
                    className="transport-color" 
                    style={{ backgroundColor: TRANSPORT_INFO[tipo._id]?.color || '#999' }}
                  ></div>
                  <div className="transport-details">
                    <span className="transport-name">
                      {TRANSPORT_INFO[tipo._id]?.name || tipo._id}
                    </span>
                    <span className="transport-count">{tipo.count} viajes</span>
                  </div>
                  <span className="transport-distance">{tipo.distanciaTotal.toFixed(1)} km</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfileModal;