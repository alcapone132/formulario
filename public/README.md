# 🔐 Servicio Web de Autenticación

Sistema completo de registro e inicio de sesión con backend Node.js/Express y frontend HTML/CSS/JavaScript.

## 📋 Características

- ✅ Registro de nuevos usuarios
- ✅ Inicio de sesión con validación
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Validación de datos en cliente y servidor
- ✅ Mensajes de error y éxito
- ✅ Interfaz responsive y moderna
- ✅ Base de datos JSON (sin necesidad de MongoDB/MySQL)
- ✅ Código completamente comentado

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **bcryptjs** - Encriptación de contraseñas
- **cors** - Manejo de CORS
- **body-parser** - Parser de datos

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos y animaciones
- **JavaScript (ES6+)** - Lógica del cliente

## 📁 Estructura del Proyecto

```
servicio-autenticacion/
│
├── server.js           # Servidor Express y API
├── package.json        # Dependencias del proyecto
├── usuarios.json       # Base de datos (se crea automáticamente)
│
└── public/            # Archivos del frontend
    ├── index.html     # Página principal
    ├── styles.css     # Estilos
    └── script.js      # Lógica del cliente
```

## 🚀 Instalación

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

### Pasos de Instalación

1. **Navegar al directorio del proyecto:**
```bash
cd servicio-autenticacion
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Iniciar el servidor:**
```bash
npm start
```

O para desarrollo con auto-reinicio:
```bash
npm run dev
```

4. **Abrir en el navegador:**
```
http://localhost:3000
```

## 📡 Endpoints de la API

### POST /api/registro
Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "usuario": "nombreusuario",
  "contrasena": "micontrasena123"
}
```

**Response Exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Registro exitoso",
  "usuario": "nombreusuario"
}
```

**Response Error (400/409):**
```json
{
  "exito": false,
  "mensaje": "Error: El usuario ya existe"
}
```

### POST /api/login
Autentica un usuario existente.

**Request Body:**
```json
{
  "usuario": "nombreusuario",
  "contrasena": "micontrasena123"
}
```

**Response Exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "Autenticación satisfactoria",
  "usuario": "nombreusuario",
  "fechaLogin": "2026-02-10T12:00:00.000Z"
}
```

**Response Error (401):**
```json
{
  "exito": false,
  "mensaje": "Error en la autenticación: Usuario o contraseña incorrectos"
}
```

### GET /api/usuarios
Lista todos los usuarios registrados (sin contraseñas).

**Response (200):**
```json
{
  "exito": true,
  "cantidad": 2,
  "usuarios": [
    {
      "id": 1707565200000,
      "usuario": "usuario1",
      "fechaRegistro": "2026-02-10T12:00:00.000Z"
    }
  ]
}
```

## 🔒 Seguridad

### Implementada
- ✅ Encriptación de contraseñas con bcrypt (10 rounds)
- ✅ Validación de longitud mínima (usuario: 3 chars, contraseña: 6 chars)
- ✅ Validación en cliente y servidor
- ✅ Las contraseñas nunca se almacenan en texto plano
- ✅ Las contraseñas nunca se envían en las respuestas

### Recomendaciones para Producción
- 🔸 Implementar JWT o sessions para autenticación persistente
- 🔸 Usar HTTPS en lugar de HTTP
- 🔸 Implementar rate limiting
- 🔸 Agregar validación de email
- 🔸 Implementar recuperación de contraseña
- 🔸 Usar una base de datos real (MongoDB, PostgreSQL, MySQL)
- 🔸 Agregar logs de auditoría
- 🔸 Implementar protección CSRF

## 🧪 Pruebas

### Usando cURL

**Registro:**
```bash
curl -X POST http://localhost:3000/api/registro \
  -H "Content-Type: application/json" \
  -d '{"usuario":"testuser","contrasena":"test123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"testuser","contrasena":"test123"}'
```

**Listar usuarios:**
```bash
curl http://localhost:3000/api/usuarios
```

### Usando la Interfaz Web

1. Abre http://localhost:3000
2. Ve a la pestaña "Registro"
3. Ingresa un usuario y contraseña
4. Haz clic en "Registrarse"
5. Ve a la pestaña "Iniciar Sesión"
6. Ingresa las mismas credenciales
7. Haz clic en "Iniciar Sesión"

## 📝 Validaciones

### Cliente (JavaScript)
- Longitud mínima de usuario: 3 caracteres
- Longitud mínima de contraseña: 6 caracteres
- Confirmación de contraseña debe coincidir
- Campos no pueden estar vacíos

### Servidor (Node.js)
- Usuario y contraseña requeridos
- Longitud mínima validada nuevamente
- Usuario no debe existir (en registro)
- Usuario debe existir (en login)
- Contraseña debe coincidir con el hash

## 🐛 Solución de Problemas

### El servidor no inicia
```bash
# Verificar que Node.js esté instalado
node --version

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error de CORS
- Asegúrate de que el frontend acceda a http://localhost:3000
- Verifica que CORS esté habilitado en server.js

### Error de conexión
- Verifica que el servidor esté corriendo
- Revisa la consola del navegador (F12)
- Verifica que el puerto 3000 esté disponible

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la Licencia ISC.

## 👨‍💻 Autor

Sistema de Autenticación v1.0

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request.

---

**Nota:** Este es un proyecto educativo. Para uso en producción, implementa las recomendaciones de seguridad mencionadas anteriormente.
# resgistro-y-inicio-andres_useche
