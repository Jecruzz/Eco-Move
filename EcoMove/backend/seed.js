const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/movilidad_sostenible')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error:', err));

const rewardSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  puntosNecesarios: Number,
  categoria: String,
  imagen: String,
  stock: Number,
  activa: { type: Boolean, default: true }
});

const Reward = mongoose.model('Reward', rewardSchema);

const recompensas = [
  {
    nombre: "PlayStation 5",
    descripcion: "Consola PlayStation 5 edición estándar",
    puntosNecesarios: 50000,
    categoria: "consola",
    stock: 5,
    imagen: "/uploads/recompensas/playstation5.avif"
  },
  {
    nombre: "Smartwatch",
    descripcion: "Smartwatch ecológico con monitoreo de actividad y estilo minimalista",
    puntosNecesarios: 15000,
    categoria: "tecnologia",
    stock: 20,
    imagen: "/uploads/recompensas/smartwatch.jpg"
  },
  {
    nombre: "Tomatodo EcoMove",
    descripcion: "Botella reutilizable de acero inoxidable con diseño EcoMove",
    puntosNecesarios: 3000,
    categoria: "producto",
    stock: 100,
    imagen: "/uploads/recompensas/tomatodo.jpg"
  },
  {
    nombre: "Cascos Gamer",
    descripcion: "Auriculares gamer con sonido envolvente y luces LED",
    puntosNecesarios: 12000,
    categoria: "tecnologia",
    stock: 30,
    imagen: "/uploads/recompensas/cascosg.jpg"
  },
  {
    nombre: "5 dólares en efectivo",
    descripcion: "Saldo de $5 en efectivo para tus compras",
    puntosNecesarios: 2000,
    categoria: "efectivo",
    stock: 200,
    imagen: "/uploads/recompensas/5dls.jpg"
  },
  {
    nombre: "Audífonos Bluetooth",
    descripcion: "Audífonos inalámbricos con cancelación de ruido",
    puntosNecesarios: 8000,
    categoria: "tecnologia",
    stock: 50,
    imagen: "/uploads/recompensas/airpods.png"
  },
  {
    nombre: "Powerbank Portátil",
    descripcion: "Batería externa de 10,000 mAh para tus dispositivos",
    puntosNecesarios: 7000,
    categoria: "tecnologia",
    stock: 60,
    imagen: "/uploads/recompensas/powerbank.jpg"
  },
  {
    nombre: "Mouse Gamer",
    descripcion: "Mouse gamer ergonómico con luces RGB",
    puntosNecesarios: 6000,
    categoria: "tecnologia",
    stock: 80,
    imagen: "/uploads/recompensas/mouseg.jpg"
  },
  {
    nombre: "Mochila EcoMove",
    descripcion: "Mochila ecológica hecha con materiales reciclados",
    puntosNecesarios: 8000,
    categoria: "producto",
    stock: 40,
    imagen: "/uploads/recompensas/mochilaeco.png"
  },
  {
    nombre: "Teclado Mecánico Gamer",
    descripcion: "Teclado mecánico con switches azules y retroiluminación RGB",
    puntosNecesarios: 10000,
    categoria: "tecnologia",
    stock: 25,
    imagen: "/uploads/recompensas/tecladog.jpg"
  }
];

async function seed() {
  try {
    console.log('Eliminando recompensas existentes...');
    await Reward.deleteMany({});
    
    console.log('Insertando nuevas recompensas...');
    await Reward.insertMany(recompensas);
    
    console.log('¡Recompensas agregadas exitosamente!');
    console.log(`Total: ${recompensas.length} recompensas`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
