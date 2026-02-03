# Eco-Move
Aplicación web para fomentar la movilidad sostenible, desarrollada con **React, Vite, Express y MongoDB**.

---

## Tecnologías usadas- Frontend: React + Vite + React Icons
- Backend: Node.js + Express
- Base de datos: MongoDB
- Estilos: CSS personalizado
- Autenticación: JWT

## Requisitos previos

Antes de comenzar asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) (local o en la nube con [MongoDB Atlas](https://www.mongodb.com/atlas))
- Git

---

## Instalación

1. **Clonar el repositorio**
#Terminal
   git clone https://github.com/Jecruzz/Eco-Move.git
   cd Eco-Move

2. Instalar dependencias del frontend
#Terminal
-cd frontend
-npm install

3. Instalar dependencias del backend
#Terminal
-cd backend
-npm install

## Configuración- Variables de entorno
- En la carpeta backend crea un archivo .env con la configuración:
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecomove
JWT_SECRET=tu_clave_secreta
- Si usas MongoDB Atlas, reemplaza MONGO_URI con tu cadena de conexión.
- Base de datos
- Asegúrate de que MongoDB esté corriendo en tu máquina:
mongod

## Ejecución - Backend
cd backend
------ npm run dev
- El servidor se levantará en http://localhost:5000.
## Ejecución - Frontend
- Frontend
cd frontend
---- npm run dev
- La aplicación estará disponible en http://localhost:5173.

