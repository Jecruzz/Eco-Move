import { useState } from 'react';
import axios from 'axios';
import './ProfileSettings.css';
import { FaTimes, FaUser, FaEnvelope, FaLock, FaCamera, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

function ProfileSettings({ user, onClose, onUpdateUser, onDeleteAccount }) {
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' o 'delete'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Estados para edición
  const [formData, setFormData] = useState({
    nombre: user.nombre,
    email: user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [imagePreview, setImagePreview] = useState(
    user.imagen ? `http://localhost:5000${user.imagen}` : null
  );
  const [newImage, setNewImage] = useState(null);
  
  // Estados para eliminación
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setMessage({ type: 'error', text: 'La imagen no debe superar 5MB' });
        return;
      }
      
      setNewImage(file);
      
      // Previsualización
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();
      
      // Solo agregar campos que cambiaron
      if (formData.nombre !== user.nombre) {
        formDataToSend.append('nombre', formData.nombre);
      }
      
      if (formData.email !== user.email) {
        formDataToSend.append('email', formData.email);
      }
      
      // Cambio de contraseña
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
          setLoading(false);
          return;
        }
        
        if (formData.newPassword.length < 6) {
          setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
          setLoading(false);
          return;
        }
        
        if (!formData.currentPassword) {
          setMessage({ type: 'error', text: 'Debes ingresar tu contraseña actual' });
          setLoading(false);
          return;
        }
        
        formDataToSend.append('currentPassword', formData.currentPassword);
        formDataToSend.append('newPassword', formData.newPassword);
      }
      
      // Nueva imagen
      if (newImage) {
        formDataToSend.append('imagen', newImage);
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/usuarios/me`,
        formDataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage({ type: 'success', text: '✅ Perfil actualizado correctamente' });
      
      // Actualizar usuario en localStorage
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Notificar al componente padre
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      
      // Resetear contraseñas
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al actualizar perfil' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (deleteConfirmation !== 'ELIMINAR') {
      setMessage({ type: 'error', text: 'Debes escribir "ELIMINAR" para confirmar' });
      return;
    }
    
    if (!passwordConfirmation) {
      setMessage({ type: 'error', text: 'Debes ingresar tu contraseña' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/usuarios/me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            password: passwordConfirmation
          }
        }
      );

      setMessage({ type: 'success', text: '✅ Cuenta eliminada correctamente' });
      
      setTimeout(() => {
        if (onDeleteAccount) {
          onDeleteAccount();
        }
      }, 1500);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al eliminar cuenta' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Configuración de Perfil</h2>
          <button className="settings-close" onClick={onClose}>
            <FaTimes size={24} />
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <FaUser size={18} style={{ marginRight: '8px' }} />
            Editar Perfil
          </button>
          <button
            className={`settings-tab ${activeTab === 'delete' ? 'active' : ''}`}
            onClick={() => setActiveTab('delete')}
          >
            <FaTrash size={18} style={{ marginRight: '8px' }} />
            Eliminar Cuenta
          </button>
        </div>

        <div className="settings-content">
          {message.text && (
            <div className={`settings-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'edit' ? (
            <form onSubmit={handleUpdateProfile}>
              {/* Foto de perfil */}
              <div className="settings-image-section">
                <div className="settings-image-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" />
                  ) : (
                    <div className="settings-image-placeholder">
                      {user.nombre.charAt(0)}
                    </div>
                  )}
                </div>
                <label className="settings-image-label">
                  <FaCamera size={20} />
                  <span>Cambiar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Nombre */}
              <div className="settings-form-group">
                <label>
                  <FaUser size={18} />
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              {/* Email */}
              <div className="settings-form-group">
                <label>
                  <FaEnvelope size={18} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Cambiar contraseña (opcional) */}
              <div className="settings-password-section">
                <h3>Cambiar Contraseña (opcional)</h3>
                
                <div className="settings-form-group">
                  <label>
                    <FaLock size={18} />
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Contraseña actual"
                  />
                </div>

                <div className="settings-form-group">
                  <label>
                    <FaLock size={18} />
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                  />
                </div>

                <div className="settings-form-group">
                  <label>
                    <FaLock size={18} />
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirmar nueva contraseña"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="settings-submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleDeleteAccount} className="settings-delete-form">
              <div className="settings-warning">
                <FaExclamationTriangle size={48} color="#f44336" />
                <h3>¡Advertencia!</h3>
                <p>Esta acción es <strong>permanente e irreversible</strong>.</p>
                <p>Se eliminarán:</p>
                <ul>
                  <li>Tu perfil y datos personales</li>
                  <li>Todo tu historial de viajes</li>
                  <li>Tus puntos y nivel</li>
                  <li>Tus medallas y logros</li>
                  <li>Tus recompensas canjeadas</li>
                </ul>
              </div>

              <div className="settings-form-group">
                <label>
                  Para confirmar, escribe <strong>ELIMINAR</strong>
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Escribe ELIMINAR"
                  required
                />
              </div>

              <div className="settings-form-group">
                <label>
                  <FaLock size={18} />
                  Confirma tu contraseña
                </label>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="settings-delete-btn"
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar Cuenta Permanentemente'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileSettings;