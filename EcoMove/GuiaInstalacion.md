# Eco-Move

Aplicación web para fomentar la movilidad sostenible, desarrollada con una arquitectura de base de datos híbrida utilizando **React**, **Vite**, **Express**, **MongoDB** y **PostgreSQL**.

---

## Tecnologías usadas

- **Frontend:** React + Vite + React Icons  
- **Backend:** Node.js + Express  
- **Base de datos híbrida:**  
  - MongoDB (Documental)  
  - PostgreSQL (Relacional con Backups Automatizados)  
- **Estilos:** CSS personalizado  
- **Autenticación:** JWT (JSON Web Tokens)  
- **Gestión de procesos:** PM2  

---

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- Node.js (versión 18 o superior)  
- npm o yarn  
- MongoDB (local o Atlas)  
- PostgreSQL  
- Git  

---

## Instalación

Clonar el repositorio:

```bash
git clone https://github.com/Jecruzz/Eco-Move.git
cd Eco-Move

Instalar dependencias del frontend:

cd frontend
npm install

Instalar dependencias del backend:
cd ../backend
npm install

Configuración
Variables de entorno
En la carpeta backend, crea un archivo .env con la siguiente configuración:
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecomove
PG_URI=postgres://usuario:password@localhost:5432/ecomove
JWT_SECRET=tu_clave_secreta

# Configuración de Backups
BACKUP_SCHEDULE=0 2 * * * ###cada 2AM
BACKUP_ON_START=false

Gestión de Backups y Automatización
El sistema utiliza tareas programadas (Cron) para garantizar la integridad de los datos en la arquitectura híbrida.

Comandos de Backup
Ejecutar desde la carpeta backend:

Realizar backup inmediato:
npm run backup

Listar backups disponibles:
npm run backup:list

Restaurar un backup específico:
npm run backup:restore <nombre_archivo>


Limpiar backups antiguos:
npm run backup:cleanup

····Servicio Automático (Cron)
··Para mantener el sistema de respaldo funcionando permanentemente en segundo plano, se recomienda el uso de PM2:
# Iniciar servicio de backup
pm2 start backup-service.js --name backup-service

# Ver logs del servicio
pm2 logs backup-service


# Formatos de Programación (Cron)
Puedes modificar BACKUP_SCHEDULE en el archivo .env siguiendo estos ejemplos:

0 2 * * * = Todos los días a las 2:00 AM

0 */6 * * * = Cada 6 horas

0 0 * * 0 = Cada domingo a medianoche

*/30 * * * * = Cada 30 minutos

##Configuraciòn
···Variables de entorno
En la carpeta backend, crea un archivo .env con la siguiente configuración:
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecomove
PG_URI=postgres://usuario:password@localhost:5432/ecomove
JWT_SECRET=tu_clave_secreta
# Configuración de Backups
BACKUP_SCHEDULE=0 2 * * *
BACKUP_ON_START=false


······ Ejecución

Backend
cd backend
npm run dev
··El servidor se levantará en http://localhost:5000.

Frontend
cd frontend
npm run dev
··La aplicación estará disponible en http://localhost:5173.


··········· Estructura del Proyecto

El proyecto está dividido en dos carpetas principales:

- **frontend/** → Contiene la aplicación en React + Vite  
- **backend/** → Contiene la API en Node.js + Express  

---

## Scripts Disponibles

### Frontend

Dentro de la carpeta `frontend`:

- **`npm run dev`** → Inicia el servidor de desarrollo en [http://localhost:5173](http://localhost:5173)  
- **`npm run build`** → Genera la versión optimizada para producción  
- **`npm run preview`** → Previsualiza la aplicación en modo producción  

### Backend

Dentro de la carpeta `backend`:

- **`npm run dev`** → Inicia el servidor en modo desarrollo en [http://localhost:5000](http://localhost:5000)  
- **`npm run backup`** → Realiza un backup inmediato de PostgreSQL  
- **`npm run backup:list`** → Lista los backups disponibles  
- **`npm run backup:restore <archivo>`** → Restaura un backup específico  
- **`npm run backup:cleanup`** → Elimina backups antiguos  

---

## Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para la autenticación de usuarios.  
Asegúrate de definir la variable `JWT_SECRET` en tu archivo `.env`.

---
