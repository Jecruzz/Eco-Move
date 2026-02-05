import { useState, useEffect } from 'react';
import axios from 'axios';
import './Challenges.css';
import { FaRuler, FaRocket, FaGlobeAmericas, FaBicycle, FaBullseye, FaCheck, FaCalendarAlt, FaDumbbell, FaTrophy } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

function Challenges({ user, onUpdateUser }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarRetos();
  }, []);

  const cargarRetos = async () => {
    try {
      const res = await axios.get(`${API_URL}/challenges`);
      setChallenges(res.data);
    } catch (error) {
      console.error('Error cargando retos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      distancia: <FaRuler size={28} color="white" />,
      viajes: <FaRocket size={28} color="white" />,
      co2: <FaGlobeAmericas size={28} color="white" />,
      transporte: <FaBicycle size={28} color="white" />
    };
    return icons[tipo] || <FaBullseye size={28} color="white" />;
  };

  const getTipoNombre = (tipo) => {
    const nombres = {
      distancia: 'Distancia',
      viajes: 'Viajes',
      co2: 'CO2 Ahorrado',
      transporte: 'Transporte Específico'
    };
    return nombres[tipo] || tipo;
  };

  const getTransporteNombre = (transporte) => {
    const nombres = {
      bicicleta: 'Bicicleta',
      caminata: 'Caminata',
      transporte_publico: 'Transporte Público',
      carpooling: 'Carpooling',
      scooter: 'Scooter'
    };
    return nombres[transporte] || transporte;
  };

  const getDiasRestantes = (fechaFin) => {
    const ahora = new Date();
    const fin = new Date(fechaFin);
    const diff = Math.ceil((fin - ahora) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando retos...</p>
      </div>
    );
  }

  const retosActivos = challenges.filter(c => !c.completado);
  const retosCompletados = challenges.filter(c => c.completado);

  return (
    <div className="challenges-page">
      <div className="challenges-header">
        <h1>!Hora de subir el nivel!</h1>
        <p>Completa retos y gana puntos extra</p>
      </div>

      {retosActivos.length === 0 && retosCompletados.length === 0 ? (
        <div className="no-challenges">
          <div className="empty-icon">
            <FaBullseye size={80} color="#999" />
          </div>
          <h3>No hay retos disponibles</h3>
          <p>Vuelve pronto para nuevos desafíos</p>
        </div>
      ) : (
        <>
          {retosActivos.length > 0 && (
            <section className="challenges-section">
              <h2>Retos Activos</h2>
              <div className="challenges-grid">
                {retosActivos.map(challenge => {
                  const progresoPorcentaje = Math.min(
                    100,
                    (challenge.progreso / challenge.objetivo) * 100
                  );
                  const diasRestantes = getDiasRestantes(challenge.fechaFin);

                  return (
                    <div key={challenge._id} className="challenge-card active">
                      <div className="challenge-header">
                        <div className="challenge-icon">
                          {getTipoIcon(challenge.tipo)}
                        </div>
                        <span className="challenge-badge">
                          {challenge.recompensaPuntos} pts
                        </span>
                      </div>

                      <h3 className="challenge-title">{challenge.titulo}</h3>
                      <p className="challenge-description">{challenge.descripcion}</p>

                      <div className="challenge-meta">
                        <span className="meta-item">
                          <strong>Tipo:</strong> {getTipoNombre(challenge.tipo)}
                        </span>
                        {challenge.transporteRequerido && (
                          <span className="meta-item">
                            <strong>Transporte:</strong> {getTransporteNombre(challenge.transporteRequerido)}
                          </span>
                        )}
                      </div>

                      <div className="challenge-progress">
                        <div className="progress-header">
                          <span className="progress-label">Progreso</span>
                          <span className="progress-value">
                            {challenge.progreso.toFixed(1)} / {challenge.objetivo}
                            {challenge.tipo === 'distancia' ? ' km' : challenge.tipo === 'co2' ? ' kg' : ''}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${progresoPorcentaje}%` }}
                          ></div>
                        </div>
                        <span className="progress-percentage">{progresoPorcentaje.toFixed(0)}%</span>
                      </div>

                      <div className="challenge-footer">
                        <span className="time-remaining">
                          {diasRestantes > 0 
                            ? `${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} restante${diasRestantes !== 1 ? 's' : ''}`
                            : 'Último día'
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {retosCompletados.length > 0 && (
            <section className="challenges-section">
              <h2 style={{ color: "black" }}>Retos Completados <FaCheck size={20} color="green" /></h2>
              <div className="challenges-grid">
                {retosCompletados.map(challenge => (
                  <div key={challenge._id} className="challenge-card completed">
                    <div className="completed-badge">
                      <FaCheck size={14} style={{ marginRight: '6px' }} />
                      Completado
                    </div>

                    <div className="challenge-header">
                      <div className="challenge-icon">
                        {getTipoIcon(challenge.tipo)}
                      </div>
                      <span className="challenge-badge green">
                        +{challenge.recompensaPuntos} pts
                      </span>
                    </div>

                    <h3 className="challenge-title">{challenge.titulo}</h3>
                    <p className="challenge-description">{challenge.descripcion}</p>

                    <div className="challenge-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill completed"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="challenges-tips">
        <h3>Consejos para Completar Retos</h3>
        <div className="tips-grid">
          <div className="tip-item">
            <span className="tip-icon">
              <FaBullseye size={28} color="#4CAF50" />
            </span>
            <p>Revisa tus retos diariamente para planificar tus viajes</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">
              <FaCalendarAlt size={28} color="#4CAF50" />
            </span>
            <p>Los retos tienen fecha límite, no los dejes para último momento</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">
              <FaDumbbell size={28} color="#4CAF50" />
            </span>
            <p>Combina varios retos en un mismo viaje para maximizar puntos</p>
          </div>
          <div className="tip-item">
            <span className="tip-icon">
              <FaTrophy size={28} color="#4CAF50" />
            </span>
            <p>Los retos completados otorgan puntos bonus extra</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Challenges;