import { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';
import { FaStar, FaBullseye, FaGlobeAmericas, FaBicycle, FaMedal, FaCalendarAlt, FaWalking, FaBus, FaCarSide, FaArrowRight } from 'react-icons/fa';
import { GiScooter } from 'react-icons/gi';

const API_URL = 'http://localhost:5000/api';

// Colores por tipo de medalla
const MEDALLA_COLORES = {
  // Impacto ambiental
  "Guardián del Planeta": "#4CAF50",
  "Héroe del Clima": "#2E7D32",
  "Campeón de la Tierra": "#1B5E20",

  // Viajes
  "Ciclista Urbano": "#2196F3",
  "Explorador Sostenible": "#1976D2",
  "Leyenda de la Movilidad": "#0D47A1",

  // Distancia
  "Maratonista Verde": "#FF9800",
  "Viajero incansable": "#F57C00",
  "Globetrotter Ecológico": "#E65100",

  // Nivel
  "Elite Sostenible": "#9C27B0",
  "Maestro EcoMove": "#7B1FA2",
  "Leyenda Verde": "#4A148C",

  // Puntos acumulados
  "Recolector de Puntos": "#FFC107",
  "Acumulador Experto": "#FFB300",
  "Rey de las Recompensas": "#FFD700",

  // Actividad especial
  "Primer Paso Verde": "#009688",
  "Semana Sostenible": "#00695C",
  "Mes de Impacto": "#004D40"
};

function Profile({ user, onUpdateUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const res = await axios.get(`${API_URL}/mobility-logs/me`);
      setLogs(res.data);

      if (onUpdateUser) {
        onUpdateUser();
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const TRANSPORT_INFO = {
    bicicleta: { icon: <FaBicycle size={24} />, name: 'Bicicleta', color: '#4CAF50' },
    caminata: { icon: <FaWalking size={24} />, name: 'Caminata', color: '#2196F3' },
    transporte_publico: { icon: <FaBus size={24} />, name: 'Transporte Público', color: '#FF9800' },
    carpooling: { icon: <FaCarSide size={24} />, name: 'Carpooling', color: '#9C27B0' },
    scooter: { icon: <GiScooter size={24} />, name: 'Scooter', color: '#F44336' }
  };

  const progresoPorcentaje = ((user.puntos % 100) / 100) * 100;
  const puntosParaSiguienteNivel = 100 - (user.puntos % 100);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-section">
          {user.imagen ? (
            <img src={`http://localhost:5000${user.imagen}`} alt={user.nombre} className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-placeholder">{user.nombre.charAt(0)}</div>
          )}
          <h1>{user.nombre}</h1>
          <p className="profile-email">{user.email}</p>
        </div>

        <div className="profile-stats-cards">
          <div className="profile-stat-card">
            <div className="stat-icon">
              <FaStar size={28} color="#FFD700" />
            </div>
            <div>
              <h3>{user.puntos}</h3>
              <p>Puntos Totales</p>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon">
              <FaBullseye size={28} color="#eb0000ff" />
            </div>
            <div>
              <h3>Nivel {user.nivel}</h3>
              <p>{puntosParaSiguienteNivel} pts al siguiente</p>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon">
              <FaGlobeAmericas size={28} color="#1100ffff" />
            </div>
            <div>
              <h3>{user.co2Ahorrado?.toFixed(1)} kg</h3>
              <p>CO₂ Ahorrado</p>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon">
              <FaBicycle size={28} color="#000000ff" />
            </div>
            <div>
              <h3>{user.stats?.totalViajes || 0}</h3>
              <p>Viajes Realizados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="level-progress">
        <div className="progress-info">
          <span>Nivel {user.nivel}</span>
          <span>{user.puntos % 100}/100 pts</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progresoPorcentaje}%` }}
          ></div>
        </div>
      </div>

      {/* Sección de logros */}
      {user.medallas && user.medallas.length > 0 && (
        <div className="profile-medallas">
          <h2>
            <FaMedal size={22} color="#FFD700" style={{ marginRight: '8px' }} />
            Tus Logros
          </h2>
          <div className="medallas-showcase">
            {user.medallas.map((medalla, index) => (
              <div 
                key={index} 
                className="medalla-item"
                style={{ background: MEDALLA_COLORES[medalla] || "#9E9E9E", color: "#fff" }}
              >
                <span className="medalla-text">{medalla}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="profile-history">
        <h2>
          <FaCalendarAlt size={22} color="#4CAF50" style={{ marginRight: '8px' }} />
          Historial de Viajes
        </h2>
        
        {loading ? (
          <p>Cargando historial...</p>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>
              <FaBicycle size={40} color="#999" />
            </p>
            <p>Aún no has registrado ningún viaje</p>
            <p>¡Comienza tu aventura sostenible!</p>
          </div>
        ) : (
          <div className="history-list">
            {logs.map(log => {
              const transport = TRANSPORT_INFO[log.tipoTransporte];
              return (
                <div key={log._id} className="history-item">
                  <div 
                    className="history-icon" 
                    style={{ backgroundColor: transport.color }}
                  >
                    {transport.icon}
                  </div>

                  <div className="history-details">
                    <div className="history-route">
                      <strong>{log.origen.nombre}</strong>
                      <span className="route-arrow">
                        <FaArrowRight size={16} color="#999" style={{ margin: '0 10px' }} />
                      </span>
                      <strong>{log.destino.nombre}</strong>
                    </div>

                    <div className="history-meta">
                      <span className="transport-type">{transport.name}</span>
                      <span className="transport-distance">{log.distancia.toFixed(1)} km</span>
                      <span className="transport-date">
                        {new Date(log.fecha).toLocaleDateString('es', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="history-impact">
                      <span className="impact-co2">
                        <FaGlobeAmericas size={16} style={{ marginRight: '6px' }} />
                        {log.co2Ahorrado.toFixed(2)} kg CO₂
                      </span>
                      <span className="impact-points">
                        <FaStar size={16} style={{ marginRight: '6px' }} />
                        +{log.puntos} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
