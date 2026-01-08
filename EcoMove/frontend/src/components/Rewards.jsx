import { useState, useEffect } from 'react';
import axios from 'axios';
import './Rewards.css';

const API_URL = 'http://localhost:5000/api';

function Rewards({ user }) {
  const [todasRecompensas, setTodasRecompensas] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('todas');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [canjeando, setCanjeando] = useState(null);

  useEffect(() => {
    cargarRecompensas();
  }, []);

  const cargarRecompensas = async () => {
    try {
      const todasRes = await axios.get(`${API_URL}/rewards`);
      setTodasRecompensas(todasRes.data);
      
      const userPoints = user?.puntos || 0;
      const disp = todasRes.data.filter(r => 
        r.puntosNecesarios <= userPoints && r.stock > 0 && r.activa
      );
      setDisponibles(disp);
    } catch (error) {
      console.error('Error cargando recompensas:', error);
    } finally {
      setLoading(false);
    }
  };

  const canjearRecompensa = async (rewardId) => {
    setCanjeando(rewardId);
    setMensaje({ texto: '', tipo: '' });
    
    try {
      const res = await axios.post(`${API_URL}/rewards/canjear/${rewardId}`);
      
      setMensaje({ 
        texto: `🎉 ${res.data.mensaje} Te quedan ${res.data.puntosRestantes} puntos.`,
        tipo: 'success' 
      });
      
      // Recargar recompensas
      setTimeout(() => {
        cargarRecompensas();
        window.location.reload(); // Recargar para actualizar puntos del usuario
      }, 2000);
      
    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.error || 'Error al canjear recompensa',
        tipo: 'error' 
      });
    } finally {
      setCanjeando(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando recompensas...</p>
      </div>
    );
  }

  const recompensas = vista === 'disponibles' ? disponibles : todasRecompensas;

  return (
    <div className="rewards-page">
      <div className="rewards-hero">
        <div className="hero-content">
          <h1>💎 Catálogo de Recompensas</h1>
          <p>Canjea tus puntos por beneficios exclusivos</p>
        </div>
        <div className="hero-points">
          <div className="points-badge">
            <span className="points-icon">⭐</span>
            <div>
              <p className="points-label">Tus Puntos</p>
              <p className="points-value">{user.puntos.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`mensaje-flotante ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="rewards-filters">
        <button
          className={`filter-btn ${vista === 'todas' ? 'active' : ''}`}
          onClick={() => setVista('todas')}
        >
          Todas ({todasRecompensas.length})
        </button>
        <button
          className={`filter-btn ${vista === 'disponibles' ? 'active' : ''}`}
          onClick={() => setVista('disponibles')}
        >
          Disponibles ({disponibles.length})
        </button>
      </div>

      {recompensas.length === 0 ? (
        <div className="empty-rewards">
          <div className="empty-icon">🎁</div>
          <h3>No hay recompensas disponibles</h3>
          <p>Sigue acumulando puntos para desbloquear beneficios</p>
        </div>
      ) : (
        <div className="rewards-grid">
          {recompensas.map(reward => {
            const puedeReclamar = user.puntos >= reward.puntosNecesarios && reward.stock > 0;
            const faltante = Math.max(0, reward.puntosNecesarios - user.puntos);
            const progreso = Math.min(100, (user.puntos / reward.puntosNecesarios) * 100);

            return (
              <div 
                key={reward._id} 
                className={`reward-card-modern ${puedeReclamar ? 'available' : 'locked'}`}
              >
                {!puedeReclamar && (
                  <div className="lock-overlay">
                    <span className="lock-icon">🔒</span>
                  </div>
                )}

                <div className="reward-header">
                  {reward.imagen ? (
                    <img 
                      src={`http://localhost:5000${reward.imagen}`} 
                      alt={reward.nombre}
                      className="reward-img"
                    />
                  ) : (
                    <div className="reward-placeholder">
                      <span className="placeholder-icon">🎁</span>
                    </div>
                  )}
                  
                  {puedeReclamar && (
                    <span className="disponible-badge">✓ Disponible</span>
                  )}
                </div>

                <div className="reward-body">
                  <h3 className="reward-title">{reward.nombre}</h3>
                  <p className="reward-desc">{reward.descripcion}</p>

                  <div className="reward-info">
                    <div className="info-item">
                      <span className="info-icon">⭐</span>
                      <span className="info-text">{reward.puntosNecesarios.toLocaleString()} puntos</span>
                    </div>
                    
                    {reward.stock && (
                      <div className="info-item">
                        <span className="info-icon">📦</span>
                        <span className="info-text">{reward.stock} disponibles</span>
                      </div>
                    )}
                  </div>

                  {!puedeReclamar && faltante > 0 && (
                    <div className="progress-section">
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${progreso}%` }}
                        ></div>
                      </div>
                      <p className="progress-text">
                        Te faltan {faltante.toLocaleString()} puntos
                      </p>
                    </div>
                  )}

                  <button
                    className={`btn-canjear ${puedeReclamar ? 'enabled' : 'disabled'}`}
                    onClick={() => puedeReclamar && canjearRecompensa(reward._id)}
                    disabled={!puedeReclamar || canjeando === reward._id}
                  >
                    {canjeando === reward._id ? (
                      <span>Canjeando...</span>
                    ) : puedeReclamar ? (
                      <span>🎉 Canjear Ahora</span>
                    ) : (
                      <span>🔒 Bloqueado</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rewards-tips">
        <h3>💡 ¿Cómo ganar más puntos?</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">🚶</span>
            <h4>Caminata</h4>
            <p>18 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🚴</span>
            <h4>Bicicleta</h4>
            <p>15 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🛴</span>
            <h4>Scooter</h4>
            <p>12 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🚗</span>
            <h4>Carpooling</h4>
            <p>10 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🚌</span>
            <h4>Bus</h4>
            <p>8 pts/km</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rewards;