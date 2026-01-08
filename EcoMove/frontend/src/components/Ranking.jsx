import { useState, useEffect } from 'react';
import axios from 'axios';
import './Ranking.css';

const API_URL = 'http://localhost:5000/api';

function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarRanking();
  }, []);

  const cargarRanking = async () => {
    try {
      const res = await axios.get(`${API_URL}/ranking`);
      setRanking(res.data);
    } catch (error) {
      console.error('Error cargando ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando ranking...</div>;
  }

  const getMedalIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="ranking-container">
      <div className="ranking-header">
        <h1>🏆 Ranking Global</h1>
        <p>Los mejores contribuyentes a la movilidad sostenible</p>
      </div>

      {/* Podio con los 3 primeros */}
      <div className="podium">
        {ranking.slice(0, 3).map((user, index) => (
          <div key={user._id} className={`podium-place place-${index + 1}`}>
            <div className="podium-card">
              {user.imagen ? (
                <img
                  src={`http://localhost:5000${user.imagen}`}
                  alt={user.nombre}
                  className="podium-image"
                />
              ) : (
                <div className="user-avatar-large">{user.nombre.charAt(0)}</div>
              )}
              <span className="medal">{getMedalIcon(index)}</span>
              <h3>{user.nombre}</h3>
              <div className="podium-stats">
                <p><strong>{user.puntos}</strong> puntos</p>
                <p>{user.co2Ahorrado.toFixed(1)} kg CO₂</p>
                <p>Nivel {user.nivel}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista del resto */}
      <div className="ranking-list">
        {ranking.slice(3).map((user, index) => (
          <div key={user._id} className="ranking-item">
            <div className="ranking-left">
              <span className="rank-number">{index + 4}</span>
              {user.imagen ? (
                <img
                  src={`http://localhost:5000${user.imagen}`}
                  alt={user.nombre}
                  className="ranking-image-small"
                />
              ) : (
                <div className="user-avatar">{user.nombre.charAt(0)}</div>
              )}
              <div className="user-details">
                <h4>{user.nombre}</h4>
                <span className="user-level">Nivel {user.nivel}</span>
              </div>
            </div>
            <div className="user-stats">
              <span className="stat-value">{user.puntos} pts</span>
              <span className="stat-value">{user.co2Ahorrado.toFixed(1)} kg CO₂</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ranking;
