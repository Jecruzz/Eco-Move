import { useState, useEffect } from 'react';
import axios from 'axios';
import './Rewards.css';
import Notification from './Notification';
import { 
  FaStar, FaGift, FaLock, FaCheck, FaBox, FaLightbulb, 
  FaWalking, FaBicycle, FaBus, FaCarSide, FaClock, FaCheckCircle,
  FaTrophy, FaFire
} from 'react-icons/fa';
import { GiScooter, GiDiamondRing } from 'react-icons/gi';

const API_URL = 'http://localhost:5000/api';

function Rewards({ user }) {
  const [todasRecompensas, setTodasRecompensas] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [canjeadas, setCanjeadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('todas');
  const [notification, setNotification] = useState(null);
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

      const token = localStorage.getItem('token');
      if (token) {
        const canjeadasRes = await axios.get(`${API_URL}/rewards/canjeadas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCanjeadas(canjeadasRes.data);
      }

    } catch (error) {
      console.error('Error cargando recompensas:', error);
      showNotification('Error al cargar las recompensas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const canjearRecompensa = async (rewardId) => {
    setCanjeando(rewardId);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/rewards/canjear/${rewardId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification(
        `${res.data.mensaje} Pronto nos pondremos en contacto para gestionar tu recompensa. Código: ${res.data.codigoReferencia}`,
        'success'
      );
      
      setTimeout(() => {
        cargarRecompensas();
        if (user) {
          user.puntos = res.data.puntosRestantes;
        }
      }, 3000);
      
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Error al canjear recompensa',
        'error'
      );
    } finally {
      setCanjeando(null);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { texto: 'Pendiente', color: '#FF9800', icon: FaClock },
      procesando: { texto: 'Procesando', color: '#2196F3', icon: FaClock },
      entregado: { texto: 'Entregado', color: '#4CAF50', icon: FaCheckCircle },
      cancelado: { texto: 'Cancelado', color: '#f44336', icon: FaLock }
    };
    return badges[estado] || badges.pendiente;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando recompensas...</p>
      </div>
    );
  }

  const recompensas = vista === 'disponibles' 
    ? disponibles 
    : vista === 'canjeadas' 
      ? canjeadas 
      : todasRecompensas;

  return (
    <div className="rewards-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="rewards-hero">
        <div className="hero-content">
          <h1>
            <FaGift size={38} style={{ marginRight: '12px' }} />
            En EcoMove ¡Ganas moviéndote!
          </h1>
            <p>
              Cada viaje sostenible suma puntos que puedes transformar en premios, beneficios y experiencias únicas.
            </p>
        </div>
        <div className="hero-points">
          <div className="points-badge">
            <span className="points-icon">
              <FaStar size={32} color="#FFD700" />
            </span>
            <div>
              <p className="points-label">Tus Puntos</p>
              <p className="points-value">{user.puntos.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

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
        <button
          className={`filter-btn ${vista === 'canjeadas' ? 'active' : ''}`}
          onClick={() => setVista('canjeadas')}
        >
          Canjeadas ({canjeadas.length})
        </button>
      </div>

      {recompensas.length === 0 ? (
        <div className="empty-rewards">
          <div className="empty-icon">
            <FaGift size={80} color="#999" />
          </div>
          <h3>No hay recompensas en esta vista</h3>
          <p>
            {vista === 'canjeadas' 
              ? 'Aún no has canjeado ninguna recompensa' 
              : 'Sigue acumulando puntos para desbloquear beneficios'}
          </p>
        </div>
      ) : (
        <div className="rewards-grid">
          {vista === 'canjeadas' ? (
            // Vista especial para recompensas canjeadas
            canjeadas.map(canje => {
              const estadoBadge = getEstadoBadge(canje.estado);
              const IconoEstado = estadoBadge.icon;
              
              return (
                <div key={canje._id} className="reward-card-canjeada">
                  <div className="reward-header">
                    {canje.imagen ? (
                      <img 
                        src={`http://localhost:5000${canje.imagen}`} 
                        alt={canje.nombre}
                        className="reward-img"
                      />
                    ) : (
                      <div className="reward-placeholder">
                        <span className="placeholder-icon">
                          <FaGift size={60} color="white" />
                        </span>
                      </div>
                    )}
                    
                    <span 
                      className="estado-badge" 
                      style={{ background: estadoBadge.color }}
                    >
                      <IconoEstado size={14} style={{ marginRight: '6px' }} />
                      {estadoBadge.texto}
                    </span>
                  </div>

                  <div className="reward-body">
                    <h3 className="reward-title">{canje.nombre}</h3>
                    <p className="reward-desc">{canje.descripcion}</p>

                    <div className="canje-info">
                      <div className="info-row">
                        <span className="info-label">Código:</span>
                        <span className="info-value codigo">{canje.codigoReferencia}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Fecha:</span>
                        <span className="info-value">
                          {new Date(canje.fechaCanje).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Puntos:</span>
                        <span className="info-value">
                          <FaStar size={14} color="#FFD700" style={{ marginRight: '4px' }} />
                          {canje.puntosNecesarios.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mensaje-contacto">
                      <FaCheckCircle size={18} color="#4CAF50" />
                      <p>Pronto nos pondremos en contacto contigo para gestionar tu recompensa.</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Vista normal para todas y disponibles
            recompensas.map(reward => {
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
                      <span className="lock-icon">
                        <FaLock size={48} color="white" />
                      </span>
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
                      <span className="placeholder-icon">
                        <FaGift size={60} color="white" />
                      </span>
                    </div>
                  )}
                </div>


                  <div className="reward-body">
                    <h3 className="reward-title">{reward.nombre}</h3>
                    <p className="reward-desc">{reward.descripcion}</p>

                    <div className="reward-info">
                      <div className="info-item">
                        <span className="info-icon">
                          <FaStar size={18} color="#FFD700" />
                        </span>
                        <span className="info-text">{reward.puntosNecesarios.toLocaleString()} puntos</span>
                      </div>
                      
                      {reward.stock && (
                        <div className="info-item">
                          <span className="info-icon">
                            <FaBox size={18} color="#666" />
                          </span>
                          <span className="info-text">{reward.stock} disponibles</span>
                        </div>
                      )}
                    </div>

                    {!puedeReclamar && faltante > 0 && (
                      <div className="progress-section">
                        <div className="progress-header">
                          <span className="progress-title">
                            <FaTrophy size={16} />
                            Progreso
                          </span>
                          <span className="progress-percentage">{progreso.toFixed(0)}%</span>
                        </div>
                        
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${progreso}%` }}
                          ></div>
                        </div>
                        
                        <div className="progress-details">
                          <span className="progress-text">
                            <FaFire size={14} />
                            Te faltan {faltante.toLocaleString()} puntos
                          </span>
                          <span className="progress-points">
                            <span className="current">{user.puntos.toLocaleString()}</span>
                            /{reward.puntosNecesarios.toLocaleString()}
                          </span>
                        </div>
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
                        <span>
                          <FaCheck size={16} style={{ marginRight: '6px' }} />
                          Canjear Ahora
                        </span>
                      ) : (
                        <span>
                          <FaLock size={16} style={{ marginRight: '6px' }} />
                          Bloqueado
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="rewards-tips">
        <h3>
          <FaLightbulb size={22} style={{ marginRight: '8px' }} />
          ¿Cómo ganar más puntos?
        </h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">
              <FaWalking size={32} color="#4CAF50" />
            </span>
            <h4>Caminata</h4>
            <p>18 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">
              <FaBicycle size={32} color="#4CAF50" />
            </span>
            <h4>Bicicleta</h4>
            <p>15 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">
              <GiScooter size={32} color="#4CAF50" />
            </span>
            <h4>Scooter</h4>
            <p>12 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">
              <FaCarSide size={32} color="#4CAF50" />
            </span>
            <h4>Carpooling</h4>
            <p>10 pts/km</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">
              <FaBus size={32} color="#4CAF50" />
            </span>
            <h4>Bus</h4>
            <p>8 pts/km</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rewards;