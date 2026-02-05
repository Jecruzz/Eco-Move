const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/movilidad_sostenible')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    const ChallengeProgress = mongoose.model('ChallengeProgress', new mongoose.Schema({
      usuarioId: mongoose.Schema.Types.ObjectId,
      challengeId: mongoose.Schema.Types.ObjectId,
      progreso: Number,
      completado: Boolean,
      fechaCompletado: Date
    }));
    
    // Eliminar todo el progreso de retos
    await ChallengeProgress.deleteMany({});
    console.log('Progreso de retos reseteado');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });