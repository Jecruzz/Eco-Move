import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import Ranking from './components/Ranking';
import Rewards from './components/Rewards';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import './App.css';

const API_URL = 'http://localhost:5000/api';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      cargarUsuario();
    } else {
      setLoading(false);
    }
  }, []);

  const cargarUsuario = async () => {
    try {
      const res = await axios.get(`${API_URL}/usuarios/me`);
      setUser(res.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          <>
            <Navbar user={user} onLogout={handleLogout} />
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/mapa" element={<MapView user={user} onUpdateUser={cargarUsuario} />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/recompensas" element={<Rewards user={user} />} />
              <Route path="/perfil" element={<Profile user={user} onUpdateUser={cargarUsuario} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;