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

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5000000 } });

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movilidad_sostenible')
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => console.error('❌ Error MongoDB:', err));

// Schemas
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
  fechaRegistro: { type: Date, default: Date.now },
  rachaDias: { type: Number, default: 0 },
  ultimaRacha: { type: Date }
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
  categoria: { 
    type: String, 
    enum: ['consola', 'tecnologia', 'producto', 'efectivo'],
    required: true 
  },
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

const challengeSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  tipo: { type: String, enum: ['distancia', 'viajes', 'co2', 'transporte'], required: true },
  objetivo: { type: Number, required: true },
  recompensaPuntos: { type: Number, required: true },
  transporteRequerido: { type: String },
  fechaInicio: { type: Date, default: Date.now },
  fechaFin: { type: Date, required: true },
  activo: { type: Boolean, default: true }
});

const challengeProgressSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  progreso: { type: Number, default: 0 },
  completado: { type: Boolean, default: false },
  fechaInicio: { type: Date, default: Date.now },
  fechaCompletado: { type: Date }
});

// Models
const User = mongoose.model('User', userSchema);
const MobilityLog = mongoose.model('MobilityLog', mobilityLogSchema);
const Reward = mongoose.model('Reward', rewardSchema);
const Partner = mongoose.model('Partner', partnerSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const ChallengeProgress = mongoose.model('ChallengeProgress', challengeProgressSchema);

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

// Función de impacto
const calcularImpacto = (tipoTransporte, distancia) => {
  const FE_AUTO = 0.192;
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
  return { co2Ahorrado: parseFloat(co2Ahorrado.toFixed(2)), puntos };
};

const calcularNivel = (puntos) => Math.floor(Math.sqrt(puntos / 100)) + 1;

// ========== AUTENTICACIÓN ==========
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
    res.status(201).json({ token, user });
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
        medallas: user.medallas,
        rachaDias: user.rachaDias
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
    res.json({ ...user.toObject(), stats: userStats, rachaDias: user.rachaDias });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ESTADÍSTICAS GLOBALES ==========
app.get('/api/estadisticas', async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments();
    const stats = await MobilityLog.aggregate([
      { $group: {
        _id: null,
        totalViajes: { $sum: 1 },
        co2Total: { $sum: '$co2Ahorrado' },
        distanciaTotal: { $sum: '$distancia' }
      }}
    ]);

    res.json({
      totalUsuarios,
      totalViajes: stats[0]?.totalViajes || 0,
      co2TotalAhorrado: stats[0]?.co2Total || 0,
      distanciaTotal: stats[0]?.distanciaTotal || 0
    });
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
      usuarioId: new mongoose.Types.ObjectId(req.userId),
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

    // lógica de racha diaria basada en calendario
    const hoy = new Date();
    const ultima = user.ultimaRacha ? new Date(user.ultimaRacha) : null;

    // Normalizamos las fechas a medianoche local
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const ultimaMidnight = ultima ? new Date(ultima.getFullYear(), ultima.getMonth(), ultima.getDate()) : null;

    if (!ultimaMidnight) {
      // Primer viaje
      user.rachaDias = 1;
      user.ultimaRacha = hoyMidnight;
      user.puntos += 200;
    } else {
      const diffDias = Math.floor((hoyMidnight - ultimaMidnight) / (1000 * 60 * 60 * 24));

      if (diffDias === 0) {
        // Ya hubo viaje hoy → mantener racha igual
        user.rachaDias = user.rachaDias || 1;
      } else if (diffDias === 1) {
        // Último viaje fue ayer → incrementar racha
        user.rachaDias += 1;
        user.ultimaRacha = hoyMidnight;
        user.puntos += 200;
      } else {
        // Se saltó días → reiniciar racha
        user.rachaDias = 1;
        user.ultimaRacha = hoyMidnight;
        user.puntos += 200;
      }
    }
    // puntos normales del viaje
    user.puntos += impacto.puntos;
    user.co2Ahorrado += impacto.co2Ahorrado;
    user.distanciaTotal += distancia;
    user.nivel = calcularNivel(user.puntos);

    await user.save();

    res.status(201).json({ log, rachaDias: user.rachaDias });
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
        _id: { mes: { $month: '$fecha' }, año: { $year: '$fecha' } },
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
      .select('nombre imagen puntos nivel co2Ahorrado medallas rachaDias');
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

app.post('/api/rewards/canjear/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const reward = await Reward.findById(req.params.id);
    
    if (!reward) return res.status(404).json({ error: 'Recompensa no encontrada' });
    if (!reward.activa || reward.stock <= 0) return res.status(400).json({ error: 'Recompensa no disponible' });
    if (user.puntos < reward.puntosNecesarios) return res.status(400).json({ error: 'Puntos insuficientes' });
    
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

// ========== RETOS ==========
app.get('/api/challenges', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const challenges = await Challenge.find({
      activo: true,
      fechaInicio: { $lte: now },
      fechaFin: { $gte: now }
    });

    const challengesConProgreso = await Promise.all(
      challenges.map(async (challenge) => {
        // Buscar progreso existente
        let progress = await ChallengeProgress.findOne({
          usuarioId: req.userId,
          challengeId: challenge._id
        });

        if (!progress) {
          progress = new ChallengeProgress({
            usuarioId: req.userId,
            challengeId: challenge._id,
            progreso: 0,
            completado: false
          });
        }

        // 🔑 Calcular progreso según tipo de reto usando MobilityLogs
        const logs = await MobilityLog.find({ usuarioId: req.userId });

        let nuevoProgreso = 0;
        switch (challenge.tipo) {
          case 'distancia':
            nuevoProgreso = logs.reduce((acc, log) => acc + log.distancia, 0);
            break;
          case 'viajes':
            nuevoProgreso = logs.length;
            break;
          case 'co2':
            nuevoProgreso = logs.reduce((acc, log) => acc + log.co2Ahorrado, 0);
            break;
          case 'transporte':
            nuevoProgreso = logs.filter(l => l.tipoTransporte === challenge.transporteRequerido).length;
            break;
        }

        progress.progreso = nuevoProgreso;

        // Verificar si completó
        if (progress.progreso >= challenge.objetivo) {
          progress.completado = true;
        }

        await progress.save();

        return {
          ...challenge.toObject(),
          progreso: progress.progreso,
          completado: progress.completado,
          progressId: progress._id
        };
      })
    );

    res.json(challengesConProgreso);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
