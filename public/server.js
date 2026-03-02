const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
mongoose.connect('mongodb+srv://af8791052_db_user:QzttH0rV6xNilcI6@cluster0.ro1kddo.mongodb.net/formulario')
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('Error MongoDB:', err));

// Modelo de Usuario
const usuarioSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now }
});
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Registro
app.post('/api/registro', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) return res.status(400).json({ exito: false, mensaje: 'Usuario y contraseña son requeridos' });
    if (usuario.length < 3) return res.status(400).json({ exito: false, mensaje: 'El usuario debe tener al menos 3 caracteres' });
    if (contrasena.length < 6) return res.status(400).json({ exito: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });

    const existe = await Usuario.findOne({ usuario });
    if (existe) return res.status(409).json({ exito: false, mensaje: 'El usuario ya existe' });

    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    await Usuario.create({ usuario, contrasena: contrasenaHash });

    res.status(201).json({ exito: true, mensaje: 'Registro exitoso', usuario });
  } catch (error) {
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) return res.status(400).json({ exito: false, mensaje: 'Datos incompletos' });

    const usuarioEncontrado = await Usuario.findOne({ usuario });
    if (!usuarioEncontrado) return res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });

    const valido = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena);
    if (!valido) return res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos' });

    res.status(200).json({ exito: true, mensaje: 'Autenticación exitosa', usuario, fechaLogin: new Date().toISOString() });
  } catch (error) {
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
});