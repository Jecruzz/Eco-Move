import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';
import { FaGlobeAmericas, FaStar, FaBullseye, FaBicycle, FaUsers, FaRocket, FaLeaf, FaMedal, FaWalking, FaBus, FaCarSide } from "react-icons/fa";
import { GiScooter } from "react-icons/gi";

const API_URL = 'http://localhost:5000/api';

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];


const TRANSPORT_ICONS = {
  bicicleta: <FaBicycle size={20} color="#4CAF50" />,
  caminata: <FaWalking size={20} color="#4CAF50" />,
  carpooling: <FaCarSide size={20} color="#4CAF50" />,
  scooter: <GiScooter size={20} color="#4CAF50" />
};

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [statsRes, globalRes, logsRes, userRes] = await Promise.all([
        axios.get(`${API_URL}/mobility-logs/stats`),
        axios.get(`${API_URL}/estadisticas`),
        axios.get(`${API_URL}/mobility-logs/me`),
        axios.get(`${API_URL}/usuarios/me`)
      ]);

      setStats(statsRes.data);
      setGlobalStats(globalRes.data);
      setRecentLogs(logsRes.data.slice(0, 5));
      

      if (userRes.data.stats) {
        user.stats = userRes.data.stats;
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  const dataPorTipo = stats?.porTipo.map(item => ({
    name: item._id,
    viajes: item.count,
    distancia: item.distanciaTotal,
    co2: item.co2Total
  })) || [];

  const dataPorMes = stats?.porMes.map(item => ({
    mes: `${item._id.mes}/${item._id.año}`,
    CO2: item.co2,
    viajes: item.viajes
  })) || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>¡Hola, {user.nombre}!</h1>
        <p>Tu impacto en el planeta</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><FaGlobeAmericas size={28} color="#002df3ff" /></div>
          <div className="stat-content">
            <h3>{user.co2Ahorrado?.toFixed(2)} kg</h3>
            <p>CO₂ Ahorrado</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon"><FaStar size={28} color="#0c0c0cff" /></div>
          <div className="stat-content">
            <h3>{user.puntos}</h3>
            <p>Puntos Totales</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon"><FaBullseye size={28} color="#ff0000ff" /></div>
          <div className="stat-content">
            <h3>Nivel {user.nivel}</h3>
            <p>Progreso</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon"><FaBicycle size={28} color="#000000ff" /></div>
          <div className="stat-content">
            <h3>{recentLogs.length}</h3>
            <p>Viajes Realizados</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>CO₂ Ahorrado por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="CO2" stroke="#4CAF50" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Viajes por Tipo de Transporte</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dataPorTipo}
                dataKey="viajes"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {dataPorTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Distancia por Tipo de Transporte</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataPorTipo}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="distancia" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Estadísticas Globales</h3>
          <div className="global-stats">
            <div className="global-stat">
              <span className="global-icon"><FaUsers size={22} color="#4CAF50" /></span>
              <div>
                <h4>{globalStats?.totalUsuarios}</h4>
                <p>Usuarios Activos</p>
              </div>
            </div>
            <div className="global-stat">
              <span className="global-icon"><FaRocket size={22} color="#2196F3" /></span>
              <div>
                <h4>{globalStats?.totalViajes}</h4>
                <p>Viajes Registrados</p>
              </div>
            </div>
            <div className="global-stat">
              <span className="global-icon"><FaLeaf size={22} color="#4CAF50" /></span>
              <div>
                <h4>{globalStats?.co2TotalAhorrado.toFixed(0)} kg</h4>
                <p>CO₂ Total Ahorrado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Actividad Reciente</h3>
        <div className="activity-list">
          {recentLogs.map(log => (
            <div key={log._id} className="activity-item">
              <span className="activity-icon">
                {TRANSPORT_ICONS[log.tipoTransporte]}
              </span>
              <div className="activity-details">
                <p className="activity-route">
                  <strong>{log.origen.nombre}</strong> → <strong>{log.destino.nombre}</strong>
                </p>
                <p className="activity-info">
                  {log.distancia.toFixed(1)} km | {log.co2Ahorrado.toFixed(2)} kg CO₂ | +{log.puntos} pts
                </p>
              </div>
              <span className="activity-date">
                {new Date(log.fecha).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {user.medallas && user.medallas.length > 0 && (
        <div className="medallas-section">
          <h3><FaMedal size={22} color="#FFD700" style={{ marginRight: "6px" }} /> Tus Medallas</h3>
          <div className="medallas-grid">
            {user.medallas.map((medalla, index) => (
              <div key={index} className="medalla-card">
                <FaMedal size={20} color="#FFD700" style={{ marginRight: "6px" }} />
                {medalla}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
