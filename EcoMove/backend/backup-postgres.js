const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración
const BACKUP_DIR = path.join(__dirname, 'backups');
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_DB = process.env.POSTGRES_DB || 'movilidad_sostenible';
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = process.env.POSTGRES_PORT || 5432;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'password';

// Ruta absoluta a los binarios de PostgreSQL 17
const PG_BIN = "C:\\Program Files\\PostgreSQL\\17\\bin";

// Configuración de retención (cuántos backups mantener)
const RETENTION_DAYS = 7; // Mantener backups de los últimos 7 días

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Directorio de backups creado');
}

// Generar nombre de archivo con timestamp
function generarNombreBackup() {
  const fecha = new Date();
  const timestamp = fecha.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `backup_${POSTGRES_DB}_${timestamp}.sql`;
}

// Función principal de backup
async function realizarBackup() {
  const nombreArchivo = generarNombreBackup();
  const rutaCompleta = path.join(BACKUP_DIR, nombreArchivo);
  
  console.log('Iniciando backup de PostgreSQL...');
  console.log(`Base de datos: ${POSTGRES_DB}`);
  console.log(`Archivo: ${nombreArchivo}`);
  
  const comando = `"${PG_BIN}\\pg_dump.exe" -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -F c -b -v -f "${rutaCompleta}" ${POSTGRES_DB}`;
  
  return new Promise((resolve, reject) => {
    exec(comando, { env: { ...process.env, PGPASSWORD: POSTGRES_PASSWORD } }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error al realizar backup:', error.message);
        reject(error);
        return;
      }
      
      const stats = fs.statSync(rutaCompleta);
      const tamanoMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log('====Backup completado exitosamente');
      console.log(`Tamaño: ${tamanoMB} MB`);
      console.log(`Ubicación: ${rutaCompleta}`);
      
      resolve(rutaCompleta);
    });
  });
}

// Limpiar backups antiguos
function limpiarBackupsAntiguos() {
  console.log('\nLimpiando backups antiguos...');
  
  const archivos = fs.readdirSync(BACKUP_DIR);
  const ahora = Date.now();
  const milisegundosRetencion = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  let eliminados = 0;
  
  archivos.forEach(archivo => {
    const rutaArchivo = path.join(BACKUP_DIR, archivo);
    const stats = fs.statSync(rutaArchivo);
    const edad = ahora - stats.mtimeMs;
    
    if (edad > milisegundosRetencion) {
      fs.unlinkSync(rutaArchivo);
      console.log(`Eliminado: ${archivo}`);
      eliminados++;
    }
  });
  
  if (eliminados === 0) {
    console.log('✨ No hay backups antiguos para eliminar');
  } else {
    console.log(`${eliminados} backup(s) antiguo(s) eliminado(s)`);
  }
}

// Listar backups disponibles
function listarBackups() {
  const archivos = fs.readdirSync(BACKUP_DIR);
  const backups = archivos
    .filter(archivo => archivo.endsWith('.sql'))
    .map(archivo => {
      const rutaArchivo = path.join(BACKUP_DIR, archivo);
      const stats = fs.statSync(rutaArchivo);
      return {
        nombre: archivo,
        tamano: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        fecha: stats.mtime.toLocaleString('es-ES')
      };
    })
    .sort((a, b) => b.nombre.localeCompare(a.nombre)); // Más reciente primero
  
  console.log('\nBackups disponibles:');
  if (backups.length === 0) {
    console.log('   No hay backups disponibles');
  } else {
    backups.forEach((backup, index) => {
      console.log(`   ${index + 1}. ${backup.nombre}`);
      console.log(`      Tamaño: ${backup.tamano}`);
      console.log(`      Fecha: ${backup.fecha}\n`);
    });
  }
  
  return backups;
}

// Restaurar desde backup
async function restaurarBackup(nombreArchivo) {
  const rutaCompleta = path.join(BACKUP_DIR, nombreArchivo);
  
  if (!fs.existsSync(rutaCompleta)) {
    throw new Error(`El archivo ${nombreArchivo} no existe`);
  }
  
  console.log('Restaurando backup...');
  console.log(`Archivo: ${nombreArchivo}`);
  console.log('ADVERTENCIA: Esto sobrescribirá la base de datos actual');
  
  const comando = `"${PG_BIN}\\pg_restore.exe" -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c -v "${rutaCompleta}"`;
  
  return new Promise((resolve, reject) => {
    exec(comando, { env: { ...process.env, PGPASSWORD: POSTGRES_PASSWORD } }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error al restaurar backup:', error.message);
        reject(error);
        return;
      }
      
      console.log('Backup restaurado exitosamente');
      resolve();
    });
  });
}

// Ejecutar según argumentos de línea de comandos
async function main() {
  const comando = process.argv[2];
  
  try {
    switch(comando) {
      case 'backup':
        await realizarBackup();
        limpiarBackupsAntiguos();
        break;
        
      case 'list':
        listarBackups();
        break;
        
      case 'restore':
        const archivo = process.argv[3];
        if (!archivo) {
          console.error('❌ Debes especificar el nombre del archivo a restaurar');
          console.log('Uso: node backup-postgres.js restore <nombre_archivo>');
          process.exit(1);
        }
        await restaurarBackup(archivo);
        break;
        
      case 'cleanup':
        limpiarBackupsAntiguos();
        break;
        
      default:
        console.log('Uso:');
        console.log('  node backup-postgres.js backup    - Crear nuevo backup');
        console.log('  node backup-postgres.js list      - Listar backups disponibles');
        console.log('  node backup-postgres.js restore <archivo> - Restaurar backup');
        console.log('  node backup-postgres.js cleanup   - Limpiar backups antiguos');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  main();
}

// Exportar funciones para uso programático
module.exports = {
  realizarBackup,
  restaurarBackup,
  listarBackups,
  limpiarBackupsAntiguos
};
