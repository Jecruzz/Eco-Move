# Justificación de Tecnologías – Eco-Move

Para el desarrollo de **Eco-Move** se seleccionó un conjunto de tecnologías modernas que garantizan eficiencia, escalabilidad y facilidad de mantenimiento. La elección de cada herramienta se fundamenta en su rendimiento, compatibilidad y adecuación a los objetivos del proyecto: fomentar la movilidad sostenible mediante una plataforma digital confiable.

---

## Frontend

### React
React fue elegido para la construcción de la interfaz de usuario por su enfoque basado en componentes:
- Permite desarrollar interfaces dinámicas e interactivas.  
- Favorece la reutilización de componentes, reduciendo la duplicidad de código.  
- Optimiza la experiencia del usuario al actualizar la interfaz sin recargar la página.  
- Cuenta con una comunidad activa y abundante documentación, lo que facilita la resolución de problemas.  

### Vite
Vite se seleccionó como herramienta de desarrollo por su rapidez y simplicidad:
- Arranque del servidor de desarrollo casi instantáneo.  
- Recarga en caliente para visualizar cambios en tiempo real.  
- Configuración moderna y ligera, con excelente integración con React.  

### React Icons
Se incorporó React Icons para mejorar la experiencia visual:
- Integración sencilla de iconos sin necesidad de imágenes externas.  
- Interfaz más clara e intuitiva para el usuario.  
- Importación selectiva de iconos, optimizando el rendimiento del frontend.  

---

## Backend

### Node.js y Express
El backend se construyó con Node.js y Express para ofrecer una API REST robusta:
- Uso de JavaScript tanto en frontend como en backend, unificando el stack tecnológico.  
- Express es ligero, flexible y fácil de configurar.  
- Manejo eficiente de múltiples solicitudes concurrentes.  
- Amplio ecosistema de librerías y middleware que agilizan el desarrollo.  

---

## Base de Datos Híbrida

### MongoDB
MongoDB se eligió como base documental por su flexibilidad:
- Base de datos NoSQL orientada a documentos.  
- Uso de formato JSON, ideal para integrarse con Node.js.  
- Escalabilidad y facilidad para modificar la estructura de datos.  
- Adecuada para manejar usuarios, registros y datos dinámicos.  

### PostgreSQL
PostgreSQL complementa la arquitectura como base relacional:
- Garantiza integridad y consistencia en datos estructurados.  
- Soporta transacciones complejas y relaciones entre tablas.  
- Se configuró con **backups automatizados** mediante tareas programadas (Cron).  
- Integración con PM2 para mantener procesos de respaldo activos en segundo plano.  

---

## Autenticación

### JWT (JSON Web Tokens)
La autenticación se implementó con JWT para asegurar el acceso:
- Sistema seguro y ligero sin necesidad de mantener sesiones en el servidor.  
- Ideal para aplicaciones SPA (Single Page Application).  
- Facilita la protección de rutas y el control de acceso.  

---

## Estilos

### CSS Personalizado
Se optó por CSS personalizado para el diseño visual:
- Mayor control sobre la apariencia de la aplicación.  
- Evita la dependencia de frameworks externos innecesarios.  
- Permite adaptar el diseño a la identidad del proyecto.  

---

## Gestión de Procesos

### PM2
PM2 se utiliza para la gestión de procesos y automatización:
- Mantiene el backend y los servicios de backup activos en segundo plano.  
- Facilita la supervisión de logs y reinicio automático en caso de fallos.  
- Asegura la continuidad del sistema en producción.  

---

## Control de Versiones

### Git y GitHub
Se emplearon Git y GitHub para la gestión del proyecto:
- Historial de cambios claro y organizado.  
- Trabajo colaborativo simplificado.  
- Facilidad para compartir y mantener el código en el repositorio.  

---

## Conclusión

La combinación de estas tecnologías permitió construir una aplicación web moderna, rápida y segura. La arquitectura híbrida de bases de datos garantiza flexibilidad y confiabilidad, mientras que las herramientas de desarrollo y gestión aseguran un flujo de trabajo eficiente. Eco-Move como una plataforma sólida para promover la movilidad sostenible mediante soluciones digitales escalables y bien estructuradas.
