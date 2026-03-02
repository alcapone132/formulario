// =========================================
// SERVICIO WEB DE AUTENTICACIÓN
// =========================================
// Este servidor proporciona endpoints para registro e inicio de sesión
// Autor: Sistema de Autenticación
// Fecha: 2026

// Importación de módulos necesarios
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// =========================================
// CONFIGURACIÓN DE MIDDLEWARES
// =========================================

// Habilita CORS para permitir peticiones desde el frontend
app.use(cors());

// Parser para JSON en el body de las peticiones
app.use(bodyParser.json());

// Parser para datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// =========================================
// CONFIGURACIÓN DE BASE DE DATOS (JSON)
// =========================================

// Ruta del archivo de base de datos
const DB_PATH = path.join(__dirname, 'usuarios.json');

/**
 * Función para leer la base de datos de usuarios
 * @returns {Array} Array de objetos de usuarios
 */
function leerUsuarios() {
    try {
        // Verifica si el archivo existe
        if (!fs.existsSync(DB_PATH)) {
            // Si no existe, crea un archivo vacío con un array
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
            return [];
        }
        // Lee el archivo y parsea el JSON
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer usuarios:', error);
        return [];
    }
}

/**
 * Función para guardar usuarios en la base de datos
 * @param {Array} usuarios - Array de objetos de usuarios
 */
function guardarUsuarios(usuarios) {
    try {
        // Escribe el array de usuarios en el archivo JSON con formato
        fs.writeFileSync(DB_PATH, JSON.stringify(usuarios, null, 2));
    } catch (error) {
        console.error('Error al guardar usuarios:', error);
    }
}

/**
 * Función para buscar un usuario por nombre de usuario
 * @param {string} usuario - Nombre de usuario a buscar
 * @returns {Object|null} Objeto del usuario o null si no existe
 */
function buscarUsuario(usuario) {
    const usuarios = leerUsuarios();
    return usuarios.find(u => u.usuario === usuario) || null;
}

// =========================================
// ENDPOINTS DE LA API
// =========================================

/**
 * ENDPOINT: Registro de nuevo usuario
 * Método: POST
 * Ruta: /api/registro
 * Body: { usuario: string, contrasena: string }
 */
app.post('/api/registro', async (req, res) => {
    try {
        // Extrae usuario y contraseña del body de la petición
        const { usuario, contrasena } = req.body;

        // Validación: Verifica que se envíen ambos campos
        if (!usuario || !contrasena) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Error: Usuario y contraseña son requeridos'
            });
        }

        // Validación: Verifica longitud mínima de usuario
        if (usuario.length < 3) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Error: El usuario debe tener al menos 3 caracteres'
            });
        }

        // Validación: Verifica longitud mínima de contraseña
        if (contrasena.length < 6) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Error: La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verifica si el usuario ya existe
        const usuarioExistente = buscarUsuario(usuario);
        if (usuarioExistente) {
            return res.status(409).json({
                exito: false,
                mensaje: 'Error: El usuario ya existe'
            });
        }

        // Encripta la contraseña usando bcrypt (10 rounds de salt)
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        // Lee todos los usuarios existentes
        const usuarios = leerUsuarios();

        // Crea el nuevo objeto de usuario
        const nuevoUsuario = {
            id: Date.now(), // ID único basado en timestamp
            usuario: usuario,
            contrasena: contrasenaHash,
            fechaRegistro: new Date().toISOString()
        };

        // Agrega el nuevo usuario al array
        usuarios.push(nuevoUsuario);

        // Guarda el array actualizado en la base de datos
        guardarUsuarios(usuarios);

        // Log en consola del servidor
        console.log(`✓ Usuario registrado: ${usuario}`);

        // Respuesta exitosa
        res.status(201).json({
            exito: true,
            mensaje: 'Registro exitoso',
            usuario: usuario
        });

    } catch (error) {
        // Manejo de errores del servidor
        console.error('Error en registro:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

/**
 * ENDPOINT: Inicio de sesión
 * Método: POST
 * Ruta: /api/login
 * Body: { usuario: string, contrasena: string }
 */
app.post('/api/login', async (req, res) => {
    try {
        // Extrae usuario y contraseña del body de la petición
        const { usuario, contrasena } = req.body;

        // Validación: Verifica que se envíen ambos campos
        if (!usuario || !contrasena) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Error en la autenticación: Datos incompletos'
            });
        }

        // Busca el usuario en la base de datos
        const usuarioEncontrado = buscarUsuario(usuario);

        // Si el usuario no existe
        if (!usuarioEncontrado) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Error en la autenticación: Usuario o contraseña incorrectos'
            });
        }

        // Compara la contraseña proporcionada con el hash almacenado
        const contrasenaValida = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);

        // Si la contraseña no coincide
        if (!contrasenaValida) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Error en la autenticación: Usuario o contraseña incorrectos'
            });
        }

        // Log en consola del servidor
        console.log(`✓ Inicio de sesión exitoso: ${usuario}`);

        // Autenticación exitosa
        res.status(200).json({
            exito: true,
            mensaje: 'Autenticación satisfactoria',
            usuario: usuario,
            fechaLogin: new Date().toISOString()
        });

    } catch (error) {
        // Manejo de errores del servidor
        console.error('Error en login:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

/**
 * ENDPOINT: Obtener todos los usuarios (solo para pruebas)
 * Método: GET
 * Ruta: /api/usuarios
 * NOTA: En producción este endpoint debería estar protegido o eliminado
 */
app.get('/api/usuarios', (req, res) => {
    try {
        const usuarios = leerUsuarios();
        // Envía usuarios sin las contraseñas por seguridad
        const usuariosSeguros = usuarios.map(u => ({
            id: u.id,
            usuario: u.usuario,
            fechaRegistro: u.fechaRegistro
        }));
        res.status(200).json({
            exito: true,
            cantidad: usuariosSeguros.length,
            usuarios: usuariosSeguros
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

/**
 * ENDPOINT: Ruta raíz
 * Método: GET
 * Ruta: /
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =========================================
// INICIALIZACIÓN DEL SERVIDOR
// =========================================

// Inicia el servidor en el puerto especificado
app.listen(PORT, '0.0.0.0', () => {
    console.log('=========================================');
    console.log('🚀 SERVIDOR DE AUTENTICACIÓN INICIADO');
    console.log('=========================================');
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Base de datos: ${DB_PATH}`);
    console.log('=========================================');
    console.log('Endpoints disponibles:');
    console.log('  POST /api/registro - Registro de usuarios');
    console.log('  POST /api/login    - Inicio de sesión');
    console.log('  GET  /api/usuarios - Listar usuarios');
    console.log('=========================================');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rechazada no manejada:', reason);
});