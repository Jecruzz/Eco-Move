const cron = require('node-cron');
const { realizarBackup, limpiarBackupsAntiguos } = require('./backup-postgres');
require('dotenv').config();

// Configuración de horarios
const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || '0 2 * * *'; 

console.log('======= Servicio de backup automático iniciado');
console.log(`======= Horario configurado: ${BACKUP_SCHEDULE}`);
console.log('   Formato cron: minuto hora día mes día-semana');
console.log('   Ejemplo: "0 2 * * *" = Todos los días a las 2:00 AM');
console.log('   Ejemplo: "0 */6 * * *" = Cada 6 horas');
console.log('   Ejemplo: "0 0 * * 0" = Cada domingo a medianoche\n');

// Programar backup automático
const tareaBackup = cron.schedule(BACKUP_SCHEDULE, async () => {
  console.log('\n Iniciando backup programado...');
  try {
    await realizarBackup();
    limpiarBackupsAntiguos();
    console.log('====== Backup programado completado\n');
  } catch (error) {
    console.error('XXX Error en backup programado:', error.message);
  }
}, {
  scheduled: true,
  timezone: "America/Guayaquil" // Cambia según tu zona horaria
});

// Realizar un backup al iniciar el servicio (opcional)
const BACKUP_ON_START = process.env.BACKUP_ON_START === 'true';

if (BACKUP_ON_START) {
  console.log('===== Realizando backup inicial...');
  realizarBackup()
    .then(() => {
      console.log('== Backup inicial completado\n');
    })
    .catch(error => {
      console.error('XXX Error en backup inicial:', error.message);
    });
}

// Manejar señales de terminación
process.on('SIGTERM', () => {
  console.log('\n==== Deteniendo servicio de backup...');
  tareaBackup.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n==== Deteniendo servicio de backup...');
  tareaBackup.stop();
  process.exit(0);
});

// Mantener el proceso vivo
console.log(' ==== Servicio de backup en ejecución');
console.log('   Presiona Ctrl+C para detener\n');