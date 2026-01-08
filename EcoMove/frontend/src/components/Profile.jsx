import { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const API_URL = 'http://localhost:5000/api';

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
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const TRANSPORT_INFO = {
    bicicleta: { icon: '🚴', name: 'Bicicleta', color: '#4CAF50' },
    caminata: { icon: '🚶', name: 'Caminata', color: '#2196F3' },
    transporte_publico: { icon: '🚌', name: 'Transporte Público', color: '#FF9800' },
    carpooling: { icon: '🚗', name: 'Carpooling', color: '#9C27B0' },
    scooter: { icon: '🛴', name: 'Scooter', color: '#F44336' }
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
            <div className="stat-icon">⭐</div>
            <div>
              <h3>{user.puntos}</h3>
              <p>Puntos Totales</p>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon">🎯</div>
            <div>
              <h3>Nivel {user.nivel}</h3>
              <p>{puntosParaSiguienteNivel} pts al siguiente</p>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon">🌍</div>
            <div>
              <h3>{user.co2Ahorrado?.toFixed(1)} kg</h3>
              <p>CO₂ Ahorrado</p>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="stat-icon">🚴</div>
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

      {user.medallas && user.medallas.length > 0 && (
        <div className="profile-medallas">
          <h2>🏅 Tus Logros</h2>
          <div className="medallas-showcase">
            {user.medallas.map((medalla, index) => (
              <div key={index} className="medalla-item">
                <span className="medalla-emoji">{medalla.split(' ')[0]}</span>
                <span className="medalla-text">{medalla.substring(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="profile-history">
        <h2>📅 Historial de Viajes</h2>
        
        {loading ? (
          <p>Cargando historial...</p>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <p>🚴 Aún no has registrado ningún viaje</p>
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
                      <span className="route-arrow">→</span>
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
                      <span className="impact-co2">🌍 {log.co2Ahorrado.toFixed(2)} kg CO₂</span>
                      <span className="impact-points">⭐ +{log.puntos} pts</span>
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