import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

const API_URL = 'http://localhost:5000/api';

// Icono verde para origen
const origenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono rojo para destino
const destinoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix para iconos de Leaflet
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

function MapView({ user, onUpdateUser }) {
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [formData, setFormData] = useState({
    tipoTransporte: 'bicicleta',
    origenNombre: '',
    destinoNombre: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [center, setCenter] = useState([-0.1807, -78.4678]); // Quito por defecto

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

  const calcularDistancia = (coord1, coord2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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

    setLoading(true);

    try {
      const distancia = calcularDistancia(origen, destino);
      
      await axios.post(`${API_URL}/mobility-logs`, {
        tipoTransporte: formData.tipoTransporte,
        distancia,
        origen: {
          lat: origen.lat,
          lng: origen.lng,
          nombre: formData.origenNombre
        },
        destino: {
          lat: destino.lat,
          lng: destino.lng,
          nombre: formData.destinoNombre
        }
      });

      setSuccess('¡Viaje registrado exitosamente! 🎉');
      setOrigen(null);
      setDestino(null);
      setFormData({
        tipoTransporte: 'bicicleta',
        origenNombre: '',
        destinoNombre: ''
      });
      
      onUpdateUser();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar viaje');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-view">
      <div className="map-sidebar">
        <h2>Registrar Viaje Verde 🌱</h2>
        
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="map-form">
          <div className="form-group">
            <label>Tipo de Transporte</label>
            <select
              value={formData.tipoTransporte}
              onChange={(e) => setFormData({...formData, tipoTransporte: e.target.value})}
            >
              <option value="bicicleta">🚴 Bicicleta</option>
              <option value="caminata">🚶 Caminata</option>
              <option value="transporte_publico">🚌 Transporte Público</option>
              <option value="carpooling">🚗 Carpooling</option>
              <option value="scooter">🛴 Scooter Eléctrico</option>
            </select>
          </div>

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
                setOrigen({ lat: center[0], lng: center[1] }); // marcador en el centro
                alert('Arrastra el marcador para ajustar el origen');
              }}
            >
              📍 Marcar en mapa
            </button>
            {origen && (
              <small className="coords-info">
                ✓ Origen: {origen.lat.toFixed(4)}, {origen.lng.toFixed(4)}
              </small>
            )}
          </div>

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
                setDestino({ lat: center[0], lng: center[1] }); // marcador en el centro
                alert('Arrastra el marcador para ajustar el destino');
              }}
            >
              📍 Marcar en mapa
            </button>
            {destino && (
              <small className="coords-info">
                ✓ Destino: {destino.lat.toFixed(4)}, {destino.lng.toFixed(4)}
              </small>
            )}
          </div>

          {origen && destino && (
            <div className="distance-info">
              <strong>Distancia:</strong> {calcularDistancia(origen, destino).toFixed(2)} km
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !origen || !destino}
            className="btn-submit"
          >
            {loading ? 'Registrando...' : '✓ Registrar Viaje'}
          </button>
        </form>

        <div className="map-instructions">
          <h4>📌 Instrucciones:</h4>
          <ol>
            <li>Haz clic en “📍 Marcar en mapa” para origen → aparece marcador verde.</li>
            <li>Arrastra el marcador hasta tu punto de inicio</li>
            <li>Haz clic en “📍 Marcar en mapa” para destino → aparece marcador rojo.</li>
            <li>Arrastra el marcador hasta tu punto de llegada</li>
            <li>Completa el formulario y pulsa “✓ Registrar Viaje”.</li>
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
              icon={origenIcon}   // 👈 aquí usamos el icono verde
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
              icon={destinoIcon}   // 👈 aquí usamos el icono rojo
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


          {origen && destino && (
            <Polyline
              positions={[
                [origen.lat, origen.lng],
                [destino.lat, destino.lng]
              ]}
              color="#4CAF50"
              weight={4}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
