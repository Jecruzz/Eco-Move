import { Link } from 'react-router-dom';
import './Landing.css';
import { FaBicycle, FaWalking, FaBus, FaCarSide } from "react-icons/fa";
import { GiScooter } from "react-icons/gi";

function Landing() {
  return (
    <div className="landing-page">

      <section className="hero-section">
        <nav className="landing-nav">
          <div className="logo">EcoMove</div>
          <div className="nav-buttons">
            <Link to="/login" className="btn-nav">Iniciar Sesión</Link>
            <Link to="/register" className="btn-nav primary">Registrarse</Link>
          </div>
        </nav>

        <div className="hero-content">
          <h1 className="hero-title">
            Movilidad Sostenible,<br />
            <span className="gradient-text">Recompensas Reales</span>
          </h1>
          <p className="hero-subtitle">
            Únete a la comunidad que está transformando la forma de moverse por la ciudad.
            Gana puntos por cada viaje sostenible y canjéalos por increíbles beneficios.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-cta">Comenzar Gratis</Link>
            <button className="btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Conocer Más
            </button>
          </div>


          <div className="hero-stats">
            <div className="stat-item">
              <h3>En Crecimiento</h3>
              <p>Únete a nuestra comunidad inicial de pioneros sostenibles</p>
            </div>
            <div className="stat-item">
              <h3>Impacto Positivo</h3>
              <p>Cada viaje suma a un futuro más limpio</p>
            </div>
            <div className="stat-item">
              <h3>Aliados en Expansión</h3>
              <p>Empresas comprometidas con la movilidad verde</p>
            </div>
          </div>
        </div>
      </section>


      <section className="features-section" id="features">
        <h2 className="section-title">¿Cómo Funciona?</h2>
        <p className="section-subtitle">Tres simples pasos para empezar a ganar recompensas</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <polyline points="17 11 19 13 23 9"/>
              </svg>
            </div>
            <h3>Regístrate Gratis</h3>
            <p>Crea tu cuenta en menos de 2 minutos. Sin costos ocultos, sin tarjetas de crédito.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon green">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3>Registra tus Viajes</h3>
            <p>Usa nuestra app para registrar cada viaje sostenible: bicicleta, caminata, transporte público o carpooling.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <h3>Gana Recompensas</h3>
            <p>Acumula puntos y canjéalos por descuentos, productos gratis y experiencias exclusivas.</p>
          </div>
        </div>
      </section>


      <section className="benefits-section">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2>Beneficios de la Movilidad Sostenible</h2>
            <ul className="benefits-list">
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Reduce tu Huella de Carbono</strong>
                  <p>Cada viaje cuenta. Visualiza en tiempo real cuánto CO2 estás ahorrando.</p>
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Mejora tu Salud</strong>
                  <p>La actividad física diaria mejora tu bienestar físico y mental.</p>
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Ahorra Dinero</strong>
                  <p>Reduce gastos en combustible, estacionamiento y mantenimiento vehicular.</p>
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Comunidad Activa</strong>
                  <p>Compite en rankings, únete a retos y conecta con personas afines.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="benefits-image">
            <div className="image-placeholder">
              <svg width="300" height="300" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r="140" fill="#4CAF50" opacity="0.1"/>
                <circle cx="150" cy="150" r="100" fill="#4CAF50" opacity="0.2"/>
                <circle cx="150" cy="150" r="60" fill="#4CAF50" opacity="0.3"/>
              </svg>
            </div>
          </div>
        </div>
      </section>


      <section className="transport-section">
        <h2 className="section-title">Modos de Transporte Sostenible</h2>
        <p className="section-subtitle">Todos los viajes ecológicos suman puntos</p>

        <div className="transport-grid">
          <div className="transport-card">
            <div className="transport-icon"><FaBicycle size={40} color="#4CAF50" /></div>
            <h4>Bicicleta</h4>
            <p className="points">15 pts/km</p>
            <p className="transport-desc">La opción más saludable y divertida para distancias medias.</p>
          </div>

          <div className="transport-card">
            <div className="transport-icon"><FaWalking size={40} color="#4CAF50" /></div>
            <h4>Caminata</h4>
            <p className="points">18 pts/km</p>
            <p className="transport-desc">Cero emisiones, máximos beneficios para tu salud.</p>
          </div>

          <div className="transport-card">
            <div className="transport-icon"><FaCarSide size={40} color="#4CAF50" /></div>
            <h4>Carpooling</h4>
            <p className="points">10 pts/km</p>
            <p className="transport-desc">Comparte viajes, reduce costos y haz nuevos amigos.</p>
          </div>

          <div className="transport-card">
            <div className="transport-icon"><GiScooter size={40} color="#4CAF50" /></div>
            <h4>Scooter Eléctrico</h4>
            <p className="points">12 pts/km</p>
            <p className="transport-desc">Rápido, eficiente y amigable con el medio ambiente.</p>
          </div>
        </div>
      </section>


      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Listo para Empezar?</h2>
          <p>Únete a miles de personas que ya están haciendo la diferencia</p>
          <Link to="/register" className="btn-cta large">Crear Cuenta Gratis</Link>
        </div>
      </section>


      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>EcoMove</h4>
            <p>Transformando la movilidad urbana, un viaje a la vez.</p>
          </div>

          <div className="footer-section">
            <h4>Producto</h4>
            <ul>
              <li><Link to="/login">Iniciar Sesión</Link></li>
              <li><Link to="/register">Registrarse</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Compañía</h4>
            <ul>
              <li><a>Contacto</a></li>
              <li><a>+593 999465255</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacidad</a></li>
              <li><a href="#terms">Términos</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 EcoMove. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
