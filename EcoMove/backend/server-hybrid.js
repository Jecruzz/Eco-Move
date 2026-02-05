const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// ========== IMPORTAR CONFIGURACIÓN POSTGRES ==========
const { User: PostgresUser, connectPostgres } = require('./postgres-config');

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

// ========== CONEXIÓN A BASES DE DATOS ==========
// MongoDB para logs, challenges, rewards, etc.
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movilidad_sostenible')
  .then(() => console.log('======= MongoDB conectado'))
  .catch(err => console.error('XXX Error MongoDB:', err));

// PostgreSQL para usuarios
connectPostgres();

// ========== SCHEMAS DE MONGODB (TODO EXCEPTO USUARIOS) ==========
const mobilityLogSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true }, // Ahora es UUID de Postgres
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
  usuarioId: { type: String, required: true }, // UUID de Postgres
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  progreso: { type: Number, default: 0 },
  completado: { type: Boolean, default: false },
  fechaInicio: { type: Date, default: Date.now },
  fechaCompletado: { type: Date }
});

const redeemedRewardSchema = new mongoose.Schema({
  usuarioId: { type: String, required: true }, // UUID de Postgres
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  puntosNecesarios: { type: Number, required: true },
  categoria: { type: String, required: true },
  imagen: { type: String },
  fechaCanje: { type: Date, default: Date.now },
  estado: { 
    type: String, 
    enum: ['pendiente', 'procesando', 'entregado', 'cancelado'],
    default: 'pendiente' 
  },
  codigoReferencia: { type: String, unique: true }
});

// Models de MongoDB
const MobilityLog = mongoose.model('MobilityLog', mobilityLogSchema);
const Reward = mongoose.model('Reward', rewardSchema);
const Partner = mongoose.model('Partner', partnerSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const ChallengeProgress = mongoose.model('ChallengeProgress', challengeProgressSchema);
const RedeemedReward = mongoose.model('RedeemedReward', redeemedRewardSchema);

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

// Funciones auxiliares
const generarCodigoReferencia = () => {
  return 'ECO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

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

// ========== AUTENTICACIÓN (POSTGRES) ==========
app.post('/api/auth/register', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // Verificar si el usuario ya existe en Postgres
    const existente = await PostgresUser.findOne({ where: { email } });
    if (existente) return res.status(400).json({ error: 'El email ya está registrado' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const imagen = req.file ? `/uploads/${req.file.filename}` : '';
    
    // Crear usuario en PostgreSQL
    const user = await PostgresUser.create({ 
      nombre, 
      email, 
      password: hashedPassword, 
      imagen 
    });
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      token, 
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        imagen: user.imagen,
        puntos: user.puntos,
        nivel: user.nivel,
        co2Ahorrado: user.co2Ahorrado,
        rachaDias: user.rachaDias
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario en PostgreSQL
    const user = await PostgresUser.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
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

// ========== PERFIL DE USUARIO (POSTGRES + MONGO) ==========
app.get('/api/usuarios/me', authMiddleware, async (req, res) => {
  try {
    // Obtener usuario de PostgreSQL
    const user = await PostgresUser.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    
    // Obtener estadísticas de MongoDB
    const stats = await MobilityLog.aggregate([
      { $match: { usuarioId: req.userId } },
      { $group: {
        _id: null,
        totalViajes: { $sum: 1 },
        distanciaTotal: { $sum: '$distancia' },
        co2Total: { $sum: '$co2Ahorrado' }
      }}
    ]);

    const userStats = stats[0] || { totalViajes: 0, distanciaTotal: 0, co2Total: 0 };
    
    res.json({ 
      ...user.toJSON(), 
      stats: userStats, 
      rachaDias: user.rachaDias 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🆕 Actualizar perfil de usuario
app.put('/api/usuarios/me', authMiddleware, upload.single('imagen'), async (req, res) => {
  try {
    const user = await PostgresUser.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { nombre, email, currentPassword, newPassword } = req.body;
    
    // Actualizar nombre si cambió
    if (nombre && nombre !== user.nombre) {
      user.nombre = nombre;
    }
    
    // Actualizar email si cambió
    if (email && email !== user.email) {
      // Verificar que el email no esté en uso
      const emailExiste = await PostgresUser.findOne({ where: { email } });
      if (emailExiste && emailExiste.id !== user.id) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
      user.email = email;
    }
    
    // Cambiar contraseña si se proporcionó
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Debes proporcionar tu contraseña actual' });
      }
      
      // Verificar contraseña actual
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      
      // Hash de la nueva contraseña
      user.password = await bcrypt.hash(newPassword, 10);
    }
    
    // Actualizar imagen si se subió una nueva
    if (req.file) {
      user.imagen = `/uploads/${req.file.filename}`;
    }
    
    await user.save();
    
    // Devolver usuario actualizado sin contraseña
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    res.json({ 
      message: 'Perfil actualizado correctamente',
      user: userResponse
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🆕 Eliminar cuenta de usuario
app.delete('/api/usuarios/me', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Debes proporcionar tu contraseña' });
    }
    
    const user = await PostgresUser.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Eliminar todos los datos relacionados en MongoDB
    await MobilityLog.deleteMany({ usuarioId: req.userId });
    await ChallengeProgress.deleteMany({ usuarioId: req.userId });
    await RedeemedReward.deleteMany({ usuarioId: req.userId });
    
    // Eliminar usuario de PostgreSQL
    await user.destroy();
    
    res.json({ message: 'Cuenta eliminada correctamente' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil de usuario
app.put('/api/usuarios/me', authMiddleware, upload.single('imagen'), async (req, res) => {
  try {
    const user = await PostgresUser.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { nombre, email, currentPassword, newPassword } = req.body;

    // Si quiere cambiar contraseña, verificar la actual
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Debes proporcionar tu contraseña actual' });
      }
      
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Verificar si el email ya existe (si se cambió)
    if (email && email !== user.email) {
      const existente = await PostgresUser.findOne({ where: { email } });
      if (existente) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
      user.email = email;
    }

    // Actualizar nombre
    if (nombre) user.nombre = nombre;

    // Actualizar imagen si se subió una nueva
    if (req.file) {
      user.imagen = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      mensaje: 'Perfil actualizado exitosamente',
      user: {
        id: user.id,
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

// Eliminar cuenta de usuario
app.delete('/api/usuarios/me', authMiddleware, async (req, res) => {
  try {
    const user = await PostgresUser.findByPk(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Eliminar todos los datos relacionados del usuario en MongoDB
    await MobilityLog.deleteMany({ usuarioId: req.userId });
    await ChallengeProgress.deleteMany({ usuarioId: req.userId });
    await RedeemedReward.deleteMany({ usuarioId: req.userId });

    // Eliminar usuario de PostgreSQL
    await user.destroy();

    res.json({ mensaje: 'Cuenta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ESTADÍSTICAS GLOBALES ==========
app.get('/api/estadisticas', async (req, res) => {
  try {
    // Contar usuarios en PostgreSQL
    const totalUsuarios = await PostgresUser.count();
    
    // Estadísticas de MongoDB
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

// ========== MOBILITY LOGS (MONGO) ==========
app.post('/api/mobility-logs', authMiddleware, async (req, res) => {
  try {
    const { tipoTransporte, distancia, origen, destino, duracion } = req.body;
    const impacto = calcularImpacto(tipoTransporte, distancia);

    // Crear log en MongoDB
    const log = new MobilityLog({
      usuarioId: req.userId, // UUID de Postgres
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

    // Actualizar usuario en PostgreSQL
    const user = await PostgresUser.findByPk(req.userId);

    // Lógica de racha diaria
    const hoy = new Date();
    const ultima = user.ultimaRacha ? new Date(user.ultimaRacha) : null;

    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const ultimaMidnight = ultima ? new Date(ultima.getFullYear(), ultima.getMonth(), ultima.getDate()) : null;

    if (!ultimaMidnight) {
      user.rachaDias = 1;
      user.ultimaRacha = hoyMidnight;
      user.puntos += 200;
    } else {
      const diffDias = Math.floor((hoyMidnight - ultimaMidnight) / (1000 * 60 * 60 * 24));

      if (diffDias === 0) {
        user.rachaDias = user.rachaDias || 1;
      } else if (diffDias === 1) {
        user.rachaDias += 1;
        user.ultimaRacha = hoyMidnight;
        user.puntos += 200;
      } else {
        user.rachaDias = 1;
        user.ultimaRacha = hoyMidnight;
        user.puntos += 200;
      }
    }
    
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
      { $match: { usuarioId: req.userId } },
      { $group: {
        _id: '$tipoTransporte',
        count: { $sum: 1 },
        distanciaTotal: { $sum: '$distancia' },
        co2Total: { $sum: '$co2Ahorrado' }
      }}
    ]);

    const porMes = await MobilityLog.aggregate([
      { $match: { usuarioId: req.userId } },
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

// ========== RANKING (POSTGRES) ==========
app.get('/api/ranking', async (req, res) => {
  try {
    const ranking = await PostgresUser.findAll({
      order: [['puntos', 'DESC']],
      limit: 20,
      attributes: ['id', 'nombre', 'imagen', 'puntos', 'nivel', 'co2Ahorrado', 'medallas', 'rachaDias']
    });
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🆕 Obtener perfil público de un usuario específico
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const user = await PostgresUser.findByPk(req.params.id, {
      attributes: ['id', 'nombre', 'imagen', 'puntos', 'nivel', 'co2Ahorrado', 'medallas', 'rachaDias', 'distanciaTotal']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener estadísticas de MongoDB
    const stats = await MobilityLog.aggregate([
      { $match: { usuarioId: req.params.id } },
      { $group: {
        _id: null,
        totalViajes: { $sum: 1 },
        distanciaTotal: { $sum: '$distancia' },
        co2Total: { $sum: '$co2Ahorrado' }
      }}
    ]);

    const userStats = stats[0] || { totalViajes: 0, distanciaTotal: 0, co2Total: 0 };
    
    // Obtener distribución por tipo de transporte
    const porTipo = await MobilityLog.aggregate([
      { $match: { usuarioId: req.params.id } },
      { $group: {
        _id: '$tipoTransporte',
        count: { $sum: 1 },
        distanciaTotal: { $sum: '$distancia' }
      }}
    ]);

    res.json({ 
      ...user.toJSON(), 
      stats: userStats,
      porTipo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ========== RECOMPENSAS (MONGO) ==========
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
    const user = await PostgresUser.findByPk(req.userId);
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

app.get('/api/rewards/canjeadas', authMiddleware, async (req, res) => {
  try {
    const canjeadas = await RedeemedReward.find({ usuarioId: req.userId })
      .sort({ fechaCanje: -1 });
    res.json(canjeadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rewards/canjear/:id', authMiddleware, async (req, res) => {
  try {
    const user = await PostgresUser.findByPk(req.userId);
    const reward = await Reward.findById(req.params.id);
    
    if (!reward) return res.status(404).json({ error: 'Recompensa no encontrada' });
    if (!reward.activa || reward.stock <= 0) return res.status(400).json({ error: 'Recompensa no disponible' });
    if (user.puntos < reward.puntosNecesarios) return res.status(400).json({ error: 'Puntos insuficientes' });
    
    user.puntos -= reward.puntosNecesarios;
    reward.stock -= 1;
    
    const codigoReferencia = generarCodigoReferencia();
    
    const recompensaCanjeada = new RedeemedReward({
      usuarioId: req.userId,
      rewardId: reward._id,
      nombre: reward.nombre,
      descripcion: reward.descripcion,
      puntosNecesarios: reward.puntosNecesarios,
      categoria: reward.categoria,
      imagen: reward.imagen,
      codigoReferencia: codigoReferencia,
      estado: 'pendiente'
    });
    
    await user.save();
    await reward.save();
    await recompensaCanjeada.save();
    
    res.json({ 
      mensaje: '¡Recompensa canjeada exitosamente!',
      puntosRestantes: user.puntos,
      recompensa: reward.nombre,
      codigoReferencia: codigoReferencia,
      estado: 'pendiente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RETOS (MONGO) ==========
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
  console.log(`==== Servidor corriendo en puerto ${PORT}`);
});