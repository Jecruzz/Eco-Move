const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));
app.use('/uploads', express.static('uploads'));

// Headers para UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Configuración de Multer para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5000000 } });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movilidad_sostenible')
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Error MongoDB:', err));

// Schemas Mejorados
const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  imagen: { type: String, default: '' },
  puntos: { type: Number, default: 0 },
  nivel: { type: Number, default: 1 },
  co2Ahorrado: { type: Number, default: 0 },
  distanciaTotal: { type: Number, default: 0 },
  medallas: [{ type: String }],
  fechaRegistro: { type: Date, default: Date.now }
});

const mobilityLogSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tipoTransporte: { 
    type: String, 
    enum: ['bicicleta', 'caminata', 'transporte_publico', 'carpooling', 'scooter'], 
    required: true 
  },
  distancia: { type: Number, required: true },
  co2Ahorrado: { type: Number, required: true },
  puntos: { type: Number, required: true },
  origen: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    nombre: String
  },
  destino: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    nombre: String
  },
  duracion: { type: Number },
  fecha: { type: Date, default: Date.now }
});

mobilityLogSchema.index({ origen: '2dsphere', destino: '2dsphere' });

const rewardSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  puntosNecesarios: { type: Number, required: true },
  categoria: { type: String, enum: ['descuento', 'producto', 'experiencia', 'especial'] },
  imagen: { type: String },
  stock: { type: Number, default: 100 },
  activa: { type: Boolean, default: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' }
});

const partnerSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, enum: ['cafeteria', 'tienda', 'restaurante', 'gimnasio', 'otro'] },
  ubicacion: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    direccion: String
  },
  convenios: [String],
  activo: { type: Boolean, default: true }
});

partnerSchema.index({ ubicacion: '2dsphere' });

const User = mongoose.model('User', userSchema);
const MobilityLog = mongoose.model('MobilityLog', mobilityLogSchema);
const Reward = mongoose.model('Reward', rewardSchema);
const Partner = mongoose.model('Partner', partnerSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Middleware de Autenticación
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Función mejorada de cálculo de impacto
const calcularImpacto = (tipoTransporte, distancia) => {
  const FE_AUTO = 0.192; // kg CO2 por km en auto promedio
  const factores = {
    bicicleta: { fe: 0, puntosPorKm: 15, bonus: 1.2 },
    caminata: { fe: 0, puntosPorKm: 18, bonus: 1.3 },
    transporte_publico: { fe: 0.041, puntosPorKm: 8, bonus: 1.0 },
    carpooling: { fe: 0.048, puntosPorKm: 10, bonus: 1.1 },
    scooter: { fe: 0.025, puntosPorKm: 12, bonus: 1.15 }
  };
  
  const factor = factores[tipoTransporte];
  const co2Ahorrado = distancia * (FE_AUTO - factor.fe);
  const puntos = Math.round(distancia * factor.puntosPorKm * factor.bonus);
  
  return {
    co2Ahorrado: parseFloat(co2Ahorrado.toFixed(2)),
    puntos
  };
};

// Sistema de Niveles y Medallas
const calcularNivel = (puntos) => Math.floor(Math.sqrt(puntos / 100)) + 1;

const verificarMedallas = (user, stats) => {
  const medallas = [];
  if (stats.co2Total >= 100) medallas.push('🌍 Guardián del Planeta');
  if (stats.totalViajes >= 50) medallas.push('🚴 Ciclista Urbano');
  if (stats.distanciaTotal >= 500) medallas.push('🏃 Maratonista Verde');
  if (user.nivel >= 10) medallas.push('⭐ Elite Sostenible');
  return medallas;
};

// ========== RUTAS DE AUTENTICACIÓN ==========

app.post('/api/auth/register', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    const existente = await User.findOne({ email });
    if (existente) return res.status(400).json({ error: 'El email ya está registrado' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const imagen = req.file ? `/uploads/${req.file.filename}` : '';
    
    const user = new User({ nombre, email, password: hashedPassword, imagen });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        imagen: user.imagen,
        puntos: user.puntos,
        nivel: user.nivel
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        imagen: user.imagen,
        puntos: user.puntos,
        nivel: user.nivel,
        co2Ahorrado: user.co2Ahorrado,
        medallas: user.medallas
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PERFIL DE USUARIO ==========

app.get('/api/usuarios/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const stats = await MobilityLog.aggregate([
      { $match: { usuarioId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: {
        _id: null,
        totalViajes: { $sum: 1 },
        distanciaTotal: { $sum: '$distancia' },
        co2Total: { $sum: '$co2Ahorrado' }
      }}
    ]);
    
    const userStats = stats[0] || { totalViajes: 0, distanciaTotal: 0, co2Total: 0 };
    const medallas = verificarMedallas(user, userStats);
    
    if (medallas.length > user.medallas.length) {
      user.medallas = medallas;
      await user.save();
    }
    
    res.json({ ...user.toObject(), stats: userStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== MOBILITY LOGS ==========

app.post('/api/mobility-logs', authMiddleware, async (req, res) => {
  try {
    const { tipoTransporte, distancia, origen, destino, duracion } = req.body;
    
    const impacto = calcularImpacto(tipoTransporte, distancia);
    
    const log = new MobilityLog({
      usuarioId: req.userId,
      tipoTransporte,
      distancia,
      origen: {
        type: 'Point',
        coordinates: [origen.lng, origen.lat],
        nombre: origen.nombre
      },
      destino: {
        type: 'Point',
        coordinates: [destino.lng, destino.lat],
        nombre: destino.nombre
      },
      duracion,
      co2Ahorrado: impacto.co2Ahorrado,
      puntos: impacto.puntos
    });
    
    await log.save();
    
    const user = await User.findById(req.userId);
    user.puntos += impacto.puntos;
    user.co2Ahorrado += impacto.co2Ahorrado;
    user.distanciaTotal += distancia;
    user.nivel = calcularNivel(user.puntos);
    await user.save();
    
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/mobility-logs/me', authMiddleware, async (req, res) => {
  try {
    const logs = await MobilityLog.find({ usuarioId: req.userId })
      .sort({ fecha: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mobility-logs/stats', authMiddleware, async (req, res) => {
  try {
    const porTipo = await MobilityLog.aggregate([
      { $match: { usuarioId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: {
        _id: '$tipoTransporte',
        count: { $sum: 1 },
        distanciaTotal: { $sum: '$distancia' },
        co2Total: { $sum: '$co2Ahorrado' }
      }}
    ]);
    
    const porMes = await MobilityLog.aggregate([
      { $match: { usuarioId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: {
        _id: { 
          mes: { $month: '$fecha' },
          año: { $year: '$fecha' }
        },
        co2: { $sum: '$co2Ahorrado' },
        viajes: { $sum: 1 }
      }},
      { $sort: { '_id.año': 1, '_id.mes': 1 } }
    ]);
    
    res.json({ porTipo, porMes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RANKING ==========

app.get('/api/ranking', async (req, res) => {
  try {
    const ranking = await User.find()
      .sort({ puntos: -1 })
      .limit(20)
      .select('nombre imagen puntos nivel co2Ahorrado medallas');
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RECOMPENSAS ==========

app.get('/api/rewards', async (req, res) => {
  try {
    const rewards = await Reward.find({ activa: true, stock: { $gt: 0 } })
      .populate('partnerId', 'nombre ubicacion');
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rewards/disponibles', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const rewards = await Reward.find({ 
      activa: true,
      stock: { $gt: 0 },
      puntosNecesarios: { $lte: user.puntos }
    }).populate('partnerId');
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CANJEAR RECOMPENSA
app.post('/api/rewards/canjear/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const reward = await Reward.findById(req.params.id);
    
    if (!reward) {
      return res.status(404).json({ error: 'Recompensa no encontrada' });
    }
    
    if (!reward.activa || reward.stock <= 0) {
      return res.status(400).json({ error: 'Recompensa no disponible' });
    }
    
    if (user.puntos < reward.puntosNecesarios) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }
    
    // Descontar puntos y stock
    user.puntos -= reward.puntosNecesarios;
    reward.stock -= 1;
    
    await user.save();
    await reward.save();
    
    res.json({ 
      mensaje: '¡Recompensa canjeada exitosamente!',
      puntosRestantes: user.puntos,
      recompensa: reward.nombre
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PARTNERS ==========

app.get('/api/partners/cercanos', authMiddleware, async (req, res) => {
  try {
    const { lng, lat, maxDistance = 5000 } = req.query;
    
    const partners = await Partner.find({
      activo: true,
      ubicacion: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistance
        }
      }
    });
    
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ESTADÍSTICAS GLOBALES ==========

app.get('/api/estadisticas', async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments();
    const totalViajes = await MobilityLog.countDocuments();
    const stats = await MobilityLog.aggregate([
      { $group: {
        _id: null,
        co2Total: { $sum: '$co2Ahorrado' },
        distanciaTotal: { $sum: '$distancia' }
      }}
    ]);
    
    res.json({
      totalUsuarios,
      totalViajes,
      co2TotalAhorrado: stats[0]?.co2Total || 0,
      distanciaTotal: stats[0]?.distanciaTotal || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});