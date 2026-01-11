const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/movilidad_sostenible')
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error:', err));

const challengeSchema = new mongoose.Schema({
  titulo: String,
  descripcion: String,
  tipo: String,
  objetivo: Number,
  recompensaPuntos: Number,
  transporteRequerido: String,
  fechaInicio: Date,
  fechaFin: Date,
  activo: Boolean
});

const Challenge = mongoose.model('Challenge', challengeSchema);

const retos = [
  {
    titulo: "Recorre 10 km esta semana",
    descripcion: "Completa 10 kilómetros usando cualquier transporte sostenible",
    tipo: "distancia",
    objetivo: 10,
    recompensaPuntos: 200,
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    activo: true
  },
  {
    titulo: "5 viajes en bicicleta",
    descripcion: "Realiza 5 viajes utilizando bicicleta",
    tipo: "transporte",
    objetivo: 5,
    recompensaPuntos: 150,
    transporteRequerido: "bicicleta",
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    activo: true
  },
  {
    titulo: "Ahorra 5 kg de CO2",
    descripcion: "Evita la emisión de 5 kilogramos de CO2",
    tipo: "co2",
    objetivo: 5,
    recompensaPuntos: 250,
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    activo: true
  },
  {
    titulo: "10 viajes sostenibles",
    descripcion: "Completa 10 viajes usando transporte ecológico",
    tipo: "viajes",
    objetivo: 10,
    recompensaPuntos: 300,
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    activo: true
  },
  {
    titulo: "Camina 15 km",
    descripcion: "Recorre 15 kilómetros caminando",
    tipo: "transporte",
    objetivo: 15,
    recompensaPuntos: 350,
    transporteRequerido: "caminata",
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    activo: true
  }
];

async function seed() {
  try {
    console.log('Eliminando retos existentes...');
    await Challenge.deleteMany({});
    
    console.log('Insertando nuevos retos...');
    await Challenge.insertMany(retos);
    
    console.log(`Retos agregados exitosamente: ${retos.length} retos`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seed();