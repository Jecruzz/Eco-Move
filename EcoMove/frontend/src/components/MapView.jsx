import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { FaMapMarkerAlt, FaCheck, FaRoute, FaLeaf } from 'react-icons/fa';
import Notification from './Notification';

const API_URL = 'http://localhost:5000/api';

// Iconos personalizados
const origenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

// 🚀 Velocidades promedio por transporte (km/h)
const VELOCIDADES = {
  caminata: 3,
  bicicleta: 7,
  scooter: 12,
  transporte_publico: 13,
  carpooling: 20
};

// 🚀 Función para calcular duración en minutos (número)
const calcularDuracion = (tipoTransporte, distanciaKm) => {
  const velocidad = VELOCIDADES[tipoTransporte] || 20;
  const horas = distanciaKm / velocidad;
  const minutos = Math.round(horas * 60);
  return minutos; // 👈 siempre número
};

// 🚀 Función para mostrar duración en formato legible
const mostrarDuracion = (minutos) => {
  if (!minutos || minutos <= 0) return "0 min";
  if (minutos >= 60) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h}h ${m}min`;
  }
  return `${minutos} min`;
};

function MapView({ user, onUpdateUser }) {
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [ruta, setRuta] = useState([]);
  const [distanciaReal, setDistanciaReal] = useState(0);
  const [duracion, setDuracion] = useState(0); // 👈 ahora número
  const [formData, setFormData] = useState({
    tipoTransporte: 'bicicleta',
    origenNombre: '',
    destinoNombre: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingRuta, setLoadingRuta] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [center, setCenter] = useState([-0.1807, -78.4678]); // Quito

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => console.log('Error obteniendo ubicación:', error)
      );
    }
  }, []);

  useEffect(() => {
    if (origen && destino) {
      calcularRutaReal();
    } else {
      setRuta([]);
      setDistanciaReal(0);
      setDuracion(0);
    }
  }, [origen, destino, formData.tipoTransporte]);

  const calcularRutaReal = async () => {
    setLoadingRuta(true);
    setError('');

    try {
      const profile = getOSRMProfile(formData.tipoTransporte);
      const url = `https://router.project-osrm.org/route/v1/${profile}/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        const distanciaKm = route.distance / 1000;
        setRuta(coordinates);
        setDistanciaReal(distanciaKm.toFixed(2));
        setDuracion(calcularDuracion(formData.tipoTransporte, distanciaKm)); // 👈 número
      } else {
        setError('No se pudo calcular la ruta. Intenta con puntos más cercanos a calles.');
        setRuta([]);
        setDistanciaReal(0);
        setDuracion(0);
      }
    } catch (err) {
      console.error('Error calculando ruta:', err);
      setError('Error al calcular la ruta por las calles');
      setRuta([]);
      setDistanciaReal(0);
      setDuracion(0);
    } finally {
      setLoadingRuta(false);
    }
  };

  const getOSRMProfile = (tipoTransporte) => {
    switch (tipoTransporte) {
      case 'bicicleta': return 'bike';
      case 'caminata': return 'foot';
      case 'scooter': return 'bike';
      default: return 'car';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!origen || !destino) {
      setError('Por favor selecciona origen y destino en el mapa');
      return;
    }

    if (!formData.origenNombre || !formData.destinoNombre) {
      setError('Por favor completa los nombres de origen y destino');
      return;
    }

    if (distanciaReal === 0) {
      setError('No se pudo calcular la ruta. Verifica los puntos seleccionados.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/mobility-logs`, {
        tipoTransporte: formData.tipoTransporte,
        distancia: parseFloat(distanciaReal),
        origen: { lat: origen.lat, lng: origen.lng, nombre: formData.origenNombre },
        destino: { lat: destino.lat, lng: destino.lng, nombre: formData.destinoNombre },
        duracion: duracion // 👈 número en minutos
      });

      setSuccess(
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaCheck color="#000000" size={18} /> Viaje registrado exitosamente
        </span>
      );
      setOrigen(null);
      setDestino(null);
      setRuta([]);
      setDistanciaReal(0);
      setDuracion(0);
      setFormData({ tipoTransporte: 'bicicleta', origenNombre: '', destinoNombre: '' });
      onUpdateUser();

    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar viaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-view">
      <div className="map-sidebar">
        <h2>
          <FaLeaf size={24} color="#4CAF50" style={{ marginRight: '10px' }} />
          Registrar Viaje Verde
        </h2>

        <form onSubmit={handleSubmit} className="map-form">
          <div className="form-group">
            <label>Tipo de Transporte</label>
            <select
              value={formData.tipoTransporte}
              onChange={(e) => setFormData({ ...formData, tipoTransporte: e.target.value })}
            >
              <option value="bicicleta">Bicicleta</option>
              <option value="caminata">Caminata</option>
              <option value="transporte_publico">Transporte Público</option>
              <option value="carpooling">Carpooling</option>
              <option value="scooter">Scooter Eléctrico</option>
            </select>
          </div>

          {/* Origen */}
          <div className="form-group">
            <label>Nombre del Origen</label>
            <input
              type="text"
              value={formData.origenNombre}
              onChange={(e) => setFormData({...formData, origenNombre: e.target.value})}
              placeholder="Ej: Mi casa"
              required
            />
            <button
              type="button"
              className="btn-map"
              onClick={() => {
                setError('');
                setOrigen({ lat: center[0], lng: center[1] });
                setSuccess(
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaMapMarkerAlt color="black" size={18} />
                    Arrastra el marcador verde para ajustar el origen
                  </span>
                );
              }}
            >
              <FaMapMarkerAlt size={16} style={{ marginRight: '6px' }} />
              Marcar en mapa
            </button>

            {origen && (
              <small className="coords-info">
                <FaCheck size={12} style={{ marginRight: '4px' }} />
                Origen: {origen.lat.toFixed(4)}, {origen.lng.toFixed(4)}
              </small>
            )}
          </div>

          {/* Destino */}
          <div className="form-group">
            <label>Nombre del Destino</label>
            <input
              type="text"
              value={formData.destinoNombre}
              onChange={(e) => setFormData({...formData, destinoNombre: e.target.value})}
              placeholder="Ej: Trabajo"
              required
            />
            <button
              type="button"
              className="btn-map"
              onClick={() => {
                setError('');
                setDestino({ lat: center[0], lng: center[1] });
                setSuccess(
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaMapMarkerAlt color="red" size={18} />
                    Arrastra el marcador rojo para ajustar el destino
                  </span>
                );
              }}
            >
              <FaMapMarkerAlt size={16} style={{ marginRight: '6px' }} />
              Marcar en mapa
            </button>

            {destino && (
              <small className="coords-info">
                <FaCheck size={12} style={{ marginRight: '4px' }} />
                Destino: {destino.lat.toFixed(4)}, {destino.lng.toFixed(4)}
              </small>
            )}
          </div>

          {loadingRuta && (
            <div className="route-info loading-route">
              <FaRoute size={16} style={{ marginRight: '6px' }} />
              Calculando ruta...
            </div>
          )}

          {!loadingRuta && distanciaReal > 0 && (
            <div className="route-info">
              <div className="route-detail">
                <FaRoute size={16} color="#4CAF50" />
                <div>
                  <strong>Distancia por calles:</strong> {distanciaReal} km
                </div>
              </div>
              <div className="route-detail">
                <strong>Tiempo estimado:</strong> {mostrarDuracion(duracion)}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !origen || !destino || distanciaReal === 0}
            className="btn-submit"
          >
            {loading ? 'Registrando...' : (
              <>
                <FaCheck size={16} style={{ marginRight: '6px' }} />
                Registrar Viaje
              </>
            )}
          </button>
        </form>

        <div className="map-instructions">
          <h4>
            <FaMapMarkerAlt size={18} style={{ marginRight: '6px' }} />
            Instrucciones:
          </h4>
          <ol>
            <li>Selecciona el tipo de transporte</li>
            <li>Haz clic en "Marcar en mapa" para origen - aparece marcador verde</li>
            <li>Arrastra el marcador verde hasta tu punto de inicio</li>
            <li>Haz clic en "Marcar en mapa" para destino - aparece marcador rojo</li>
            <li>Arrastra el marcador rojo hasta tu punto de llegada</li>
            <li>El sistema calculará la ruta por las calles automáticamente</li>
            <li>Completa los nombres y pulsa "Registrar Viaje"</li>
          </ol>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <ChangeView center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {origen && (
            <Marker
              position={[origen.lat, origen.lng]}
              draggable={true}
              icon={origenIcon}
              eventHandlers={{
                dragend: (e) => {
                  const newPos = e.target.getLatLng();
                  setOrigen({ lat: newPos.lat, lng: newPos.lng });
                }
              }}
            >
              <Popup>
                <strong>Origen</strong><br />
                {formData.origenNombre || 'Sin nombre'}
              </Popup>
            </Marker>
          )}

          {destino && (
            <Marker
              position={[destino.lat, destino.lng]}
              draggable={true}
              icon={destinoIcon}
              eventHandlers={{
                dragend: (e) => {
                  const newPos = e.target.getLatLng();
                  setDestino({ lat: newPos.lat, lng: newPos.lng });
                }
              }}
            >
              <Popup>
                <strong>Destino</strong><br />
                {formData.destinoNombre || 'Sin nombre'}
              </Popup>
            </Marker>
          )}

          {ruta.length > 0 && (
            <Polyline
              positions={ruta}
              color="#4CAF50"
              weight={5}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      {/* ✅ Notificaciones flotantes */}
      {success && (
        <Notification
          message={success}
          type="success"
          onClose={() => setSuccess("")}
        />
      )}

      {error && (
        <Notification
          message={error}
          type="error"
          onClose={() => setError("")}
        />
      )}
    </div>
  );
}

export default MapView;