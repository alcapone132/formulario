const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://af8791052_db_user:QzttH0rV6xNilcI6@cluster0.ro1kddo.mongodb.net/formulario')
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Modelo de Usuario
const usuarioSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now }
});
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Almacén temporal de códigos pendientes
const codigosPendientes = {};

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// =========================================
// BREVO - Envío de email via API HTTP
// =========================================
function generarCodigo() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function enviarCodigoEmail(email, codigo) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            sender: { name: 'Sistema de Autenticación', email: 'af8791052@gmail.com' },
            to: [{ email }],
            subject: '🔐 Código de verificación',
            htmlContent: `
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

        const options = {
            hostname: 'api.brevo.com',
            path: '/v3/smtp/email',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    reject(new Error(`Brevo error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// =========================================
// ENDPOINTS
// =========================================

// PASO 1 - Registro: valida y envía código
app.post('/api/registro', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena)
            return res.status(400).json({ exito: false, mensaje: 'Usuario y contraseña son requeridos' });
        if (usuario.length < 3)
            return res.status(400).json({ exito: false, mensaje: 'El usuario debe tener al menos 3 caracteres' });
        if (contrasena.length < 6)
            return res.status(400).json({ exito: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });

        const existe = await Usuario.findOne({ usuario });
        if (existe)
            return res.status(409).json({ exito: false, mensaje: 'El usuario ya existe' });

        const codigo = generarCodigo();
        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        codigosPendientes[usuario] = {
            codigo,
            expira: Date.now() + 10 * 60 * 1000,
            contrasenaHash
        };

        await enviarCodigoEmail(usuario, codigo);
        console.log(`✓ Código enviado a: ${usuario}`);

        res.status(200).json({
            exito: true,
            mensaje: 'Código enviado a tu correo',
            requiereVerificacion: true
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al enviar el código: ' + error.message });
    }
});

// PASO 2 - Verificar código y crear cuenta
app.post('/api/verificar', async (req, res) => {
    try {
        const { usuario, codigo } = req.body;

        if (!usuario || !codigo)
            return res.status(400).json({ exito: false, mensaje: 'Usuario y código son requeridos' });

        const pendiente = codigosPendientes[usuario];

        if (!pendiente)
            return res.status(400).json({ exito: false, mensaje: 'No hay registro pendiente. Vuelve a registrarte.' });

        if (Date.now() > pendiente.expira) {
            delete codigosPendientes[usuario];
            return res.status(400).json({ exito: false, mensaje: 'El código expiró. Vuelve a registrarte.' });
        }

        if (pendiente.codigo !== codigo.trim())
            return res.status(400).json({ exito: false, mensaje: 'Código incorrecto' });

        await Usuario.create({ usuario, contrasena: pendiente.contrasenaHash });
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

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;
        if (!usuario || !contrasena)
            return res.status(400).json({ exito: false, mensaje: 'Datos incompletos' });

        const usuarioEncontrado = await Usuario.findOne({ usuario });
        if (!usuarioEncontrado)
            return res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });

        const valido = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);
        if (!valido)
            return res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });

        console.log(`✓ Login exitoso: ${usuario}`);
        res.status(200).json({ exito: true, mensaje: 'Autenticación exitosa', usuario, fechaLogin: new Date().toISOString() });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
});

// Listar usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find({}, { contrasena: 0 });
        res.status(200).json({ exito: true, cantidad: usuarios.length, usuarios });
    } catch (error) {
        res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});
