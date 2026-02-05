const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Configuración de conexión a PostgreSQL
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'movilidad_sostenible',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || 'password',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Modelo de Usuario en PostgreSQL
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imagen: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  puntos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nivel: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  co2Ahorrado: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  distanciaTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  medallas: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  rachaDias: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ultimaRacha: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'fechaRegistro',
  updatedAt: 'fechaActualizacion'
});

// Función para conectar y sincronizar
const connectPostgres = async () => {
  try {
    await sequelize.authenticate();
    console.log('======= PostgreSQL conectado correctamente');
    
    await sequelize.sync({ alter: false });
    console.log('======= Modelos PostgreSQL sincronizados');
  } catch (error) {
    console.error('XXXX Error conectando a PostgreSQL:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  connectPostgres
};