import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const API_URL = 'http://localhost:5000/api';

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('nombre', formData.nombre);
      data.append('email', formData.email);
      data.append('password', formData.password);
      if (imagen) data.append('imagen', imagen);

      const res = await axios.post(`${API_URL}/auth/register`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onRegister(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>EcoMove</h1>
          <p>Únete a la revolución verde</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Crear Cuenta</h2>
          
          {error && <div className="error-message">{error}</div>}

          <div className="form-group image-upload">
            <label>Foto de Perfil</label>
            <div className="image-preview">
              {preview ? (
                <img src={preview} alt="Preview" />
              ) : (
                <div className="placeholder">📸</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="imagen"
            />
            <label htmlFor="imagen" className="file-label">
              Seleccionar imagen
            </label>
          </div>

          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>

          <p className="auth-link">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;