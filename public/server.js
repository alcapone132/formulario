// =========================================
// SERVICIO WEB DE AUTENTICACIÓN
// =========================================
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================
// CONFIGURACIÓN DE NODEMAILER (Gmail + IPv4)
// =========================================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    family: 4,              // ← fuerza IPv4, soluciona error en Render
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,   // tu-correo@gmail.com
        pass: process.env.EMAIL_PASS    // contraseña de aplicación de Google
    }
});

// =========================================
// ALMACÉN TEMPORAL DE CÓDIGOS
// { email: { codigo, expira, datosUsuario } }
// =========================================
const codigosPendientes = {};

// =========================================
// MIDDLEWARES
// =========================================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// =========================================
// BASE DE DATOS (JSON)
// =========================================
const DB_PATH = path.join(__dirname, 'usuarios.json');

function leerUsuarios() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
            return [];
        }
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (error) {
        console.error('Error al leer usuarios:', error);
        return [];
    }
}

function guardarUsuarios(usuarios) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(usuarios, null, 2));
    } catch (error) {
        console.error('Error al guardar usuarios:', error);
    }
}

function buscarUsuario(usuario) {
    return leerUsuarios().find(u => u.usuario === usuario) || null;
}

// =========================================
// HELPERS
// =========================================

// Genera código de 6 dígitos
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Envía el email con el código
async function enviarCodigoEmail(email, codigo) {
    await transporter.sendMail({
        from: `"Sistema de Autenticación" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Código de verificación',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:10px;">
                <h2 style="color:#667eea;">Confirma tu registro</h2>
                <p>Usa este código para completar tu registro:</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#764ba2;text-align:center;padding:20px;background:#f5f5f5;border-radius:8px;margin:20px 0;">
                    ${codigo}
                </div>
                <p style="color:#999;font-size:12px;">Este código expira en 10 minutos.</p>
            </div>
        `
    });
}

// =========================================
// ENDPOINTS
// =========================================

/**
 * PASO 1 - Registro: recibe datos y envía código al email
 * POST /api/registro
 * Body: { usuario, contrasena }
 */
app.post('/api/registro', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena)
            return res.status(400).json({ exito: false, mensaje: 'Usuario y contraseña son requeridos' });

        if (usuario.length < 3)
            return res.status(400).json({ exito: false, mensaje: 'El usuario debe tener al menos 3 caracteres' });

        if (contrasena.length < 6)
            return res.status(400).json({ exito: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });

        if (buscarUsuario(usuario))
            return res.status(409).json({ exito: false, mensaje: 'El usuario ya existe' });

        // Genera y guarda el código temporalmente
        const codigo = generarCodigo();
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        codigosPendientes[usuario] = {
            codigo,
            expira: Date.now() + 10 * 60 * 1000, // 10 minutos
            datosUsuario: {
                id: Date.now(),
                usuario,
                contrasena: contrasenaHash,
                fechaRegistro: new Date().toISOString()
            }
        };

        // Envía el código al email
        await enviarCodigoEmail(usuario, codigo);

        console.log(`✓ Código enviado a: ${usuario}`);

        res.status(200).json({
            exito: true,
            mensaje: 'Código de verificación enviado a tu correo',
            requiereVerificacion: true
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al enviar el código. Verifica que el correo sea válido.' });
    }
});

/**
 * PASO 2 - Verificar código y completar registro
 * POST /api/verificar
 * Body: { usuario, codigo }
 */
app.post('/api/verificar', (req, res) => {
    try {
        const { usuario, codigo } = req.body;

        if (!usuario || !codigo)
            return res.status(400).json({ exito: false, mensaje: 'Usuario y código son requeridos' });

        const pendiente = codigosPendientes[usuario];

        if (!pendiente)
            return res.status(400).json({ exito: false, mensaje: 'No hay registro pendiente para este usuario' });

        if (Date.now() > pendiente.expira) {
            delete codigosPendientes[usuario];
            return res.status(400).json({ exito: false, mensaje: 'El código expiró. Vuelve a registrarte.' });
        }

        if (pendiente.codigo !== codigo.trim())
            return res.status(400).json({ exito: false, mensaje: 'Código incorrecto' });

        // Código correcto → guarda el usuario
        const usuarios = leerUsuarios();
        usuarios.push(pendiente.datosUsuario);
        guardarUsuarios(usuarios);
        delete codigosPendientes[usuario];

        console.log(`✓ Usuario verificado y registrado: ${usuario}`);

        res.status(201).json({
            exito: true,
            mensaje: 'Registro completado exitosamente',
            usuario
        });

    } catch (error) {
        console.error('Error en verificación:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
});

/**
 * Login
 * POST /api/login
 */
app.post('/api/login', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena)
            return res.status(400).json({ exito: false, mensaje: 'Datos incompletos' });

        const usuarioEncontrado = buscarUsuario(usuario);
        if (!usuarioEncontrado)
            return res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });

        const contrasenaValida = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);
        if (!contrasenaValida)
            return res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });

        console.log(`✓ Login exitoso: ${usuario}`);

        res.status(200).json({
            exito: true,
            mensaje: 'Autenticación satisfactoria',
            usuario,
            fechaLogin: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
});

/**
 * Listar usuarios (sin contraseñas)
 * GET /api/usuarios
 */
app.get('/api/usuarios', (req, res) => {
    try {
        const usuarios = leerUsuarios().map(u => ({
            id: u.id,
            usuario: u.usuario,
            fechaRegistro: u.fechaRegistro
        }));
        res.status(200).json({ exito: true, cantidad: usuarios.length, usuarios });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * ENDPOINT DE PRUEBA - verifica configuración del email
 * GET /api/test-email
 * Eliminar en producción
 */
app.get('/api/test-email', async (req, res) => {
    try {
        // Verifica que las variables de entorno existen
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({
                exito: false,
                mensaje: 'Variables EMAIL_USER o EMAIL_PASS no configuradas en Render'
            });
        }

        // Verifica la conexión SMTP
        await transporter.verify();

        // Envía un email de prueba al mismo remitente
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: '✅ Test de conexión exitoso',
            text: 'El servidor de email está funcionando correctamente.'
        });

        res.json({
            exito: true,
            mensaje: `Email de prueba enviado a ${process.env.EMAIL_USER}`,
            emailUser: process.env.EMAIL_USER
        });

    } catch (error) {
        res.status(500).json({
            exito: false,
            mensaje: 'Error de conexión SMTP',
            error: error.message
        });
    }
});

// =========================================
// INICIO DEL SERVIDOR
// =========================================
app.listen(PORT, () => {
    console.log('=========================================');
    console.log('🚀 SERVIDOR DE AUTENTICACIÓN INICIADO');
    console.log('=========================================');
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📁 Base de datos: ${DB_PATH}`);
    console.log('=========================================');
    console.log('Endpoints disponibles:');
    console.log('  POST /api/registro  - Envía código al email');
    console.log('  POST /api/verificar - Verifica código y crea cuenta');
    console.log('  POST /api/login     - Inicio de sesión');
    console.log('  GET  /api/usuarios  - Listar usuarios');
    console.log('=========================================');
});

process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('Promise rechazada:', reason);
});
