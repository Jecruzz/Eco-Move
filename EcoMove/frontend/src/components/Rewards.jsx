import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Rewards({ user }) {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await axios.get(`${API_URL}/rewards`);
        setRewards(res.data);
      } catch (error) {
        console.error("Error al cargar recompensas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando recompensas...</p>
      </div>
    );
  }

  return (
    <div className="rewards-container">
      <h2>🎁 Catálogo de Recompensas</h2>
      <p>Canjea tus puntos obtenidos con movilidad sostenible 🌱</p>

      {rewards.length === 0 ? (
        <p>No hay recompensas cargadas en el sistema.</p>
      ) : (
        <ul className="rewards-list">
          {rewards.map((reward) => {
            const canRedeem = user && user.puntos >= reward.puntosNecesarios;
            return (
              <li
                key={reward._id}
                className={`reward-item ${canRedeem ? "available" : "locked"}`}
              >
                {reward.imagen && (
                  <img
                    src={reward.imagen}
                    alt={reward.nombre}
                    className="reward-image"
                  />
                )}
                <h3>{reward.nombre}</h3>
                <p>{reward.descripcion}</p>
                <p>
                  <strong>Puntos requeridos:</strong> {reward.puntosNecesarios}
                </p>
                <p>
                  <strong>Stock disponible:</strong> {reward.stock}
                </p>

                {canRedeem ? (
                  <button className="btn-redeem">Canjear</button>
                ) : (
                  <p className="text-muted">
                    🔒 Necesitas {reward.puntosNecesarios - (user?.puntos || 0)}{" "}
                    puntos más
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
