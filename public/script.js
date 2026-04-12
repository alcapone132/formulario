// =========================================
// LÓGICA DEL CLIENTE - SISTEMA DE AUTENTICACIÓN
// =========================================
const API_URL = '/api';

function mostrarTab(tabName, e) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    if (e && e.target) e.target.classList.add('active');
    limpiarMensajes();
}

function mostrarMensaje(elementId, mensaje, tipo) {
    const div = document.getElementById(elementId);
    div.textContent = mensaje;
    div.classList.remove('exito', 'error', 'show');
    div.classList.add(tipo, 'show');
    setTimeout(() => div.classList.remove('show'), 6000);
}

function limpiarMensajes() {
    document.querySelectorAll('.mensaje').forEach(m => m.classList.remove('show'));
}

// =========================================
// MODAL DE VERIFICACIÓN
// =========================================
function mostrarModal(email) {
    window._usuarioPendiente = email;
    document.getElementById('modal-email').textContent = email;
    document.querySelectorAll('.codigo-digito').forEach(d => d.value = '');
    document.getElementById('modal-mensaje').classList.remove('show');
    document.getElementById('modal-verificacion').style.display = 'flex';
    setTimeout(() => document.querySelectorAll('.codigo-digito')[0].focus(), 100);
}

function ocultarModal() {
    document.getElementById('modal-verificacion').style.display = 'none';
}

// =========================================
// DOM CONTENT LOADED — único, centralizado
// =========================================
document.addEventListener('DOMContentLoaded', function () {

    // — Dígitos modal de REGISTRO —
    const digitos = document.querySelectorAll('#modal-verificacion .codigo-digito');
    digitos.forEach((input, i) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '');
            if (input.value && i < digitos.length - 1) digitos[i + 1].focus();
            if (Array.from(digitos).every(d => d.value)) verificarCodigo();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && i > 0) digitos[i - 1].focus();
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const texto = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            digitos.forEach((d, j) => { if (texto[j]) d.value = texto[j]; });
            digitos[Math.min(texto.length, digitos.length - 1)].focus();
            if (texto.length >= 6) verificarCodigo();
        });
    });

    document.getElementById('btn-verificar').addEventListener('click', verificarCodigo);

    document.getElementById('btn-reenviar').addEventListener('click', async () => {
        const btn = document.getElementById('btn-reenviar');
        btn.textContent = 'Enviando...';
        btn.disabled = true;
        mostrarMensaje('modal-mensaje', 'Código reenviado a tu correo ✓', 'exito');
        setTimeout(() => {
            btn.textContent = '¿No llegó? Reenviar código';
            btn.disabled = false;
        }, 4000);
    });

    // — Dígitos modal de RECUPERACIÓN —
    const digitosRec = document.querySelectorAll('#recuperar-digitos .codigo-digito');
    digitosRec.forEach((input, i) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '');
            if (input.value && i < digitosRec.length - 1) digitosRec[i + 1].focus();
            if (Array.from(digitosRec).every(d => d.value)) verificarCodigoRecuperacion();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && i > 0) digitosRec[i - 1].focus();
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const texto = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            digitosRec.forEach((d, j) => { if (texto[j]) d.value = texto[j]; });
            digitosRec[Math.min(texto.length, digitosRec.length - 1)].focus();
            if (texto.length >= 6) verificarCodigoRecuperacion();
        });
    });

    verificarConexion();
});

async function verificarCodigo() {
    const digitos = document.querySelectorAll('#modal-verificacion .codigo-digito');
    const codigo = Array.from(digitos).map(d => d.value).join('');

    if (codigo.length < 6) {
        mostrarMensaje('modal-mensaje', 'Ingresa los 6 dígitos del código', 'error');
        return;
    }

    const btn = document.getElementById('btn-verificar');
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
        const response = await fetch(`${API_URL}/verificar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: window._usuarioPendiente, codigo })
        });

        const data = await response.json();

        if (data.exito) {
            ocultarModal();
            mostrarMensaje('registro-mensaje', '✓ Registro completado. Ya puedes iniciar sesión.', 'exito');
            setTimeout(() => document.querySelectorAll('.tab-button')[1].click(), 2000);
        } else {
            mostrarMensaje('modal-mensaje', data.mensaje, 'error');
            digitos.forEach(d => d.value = '');
            digitos[0].focus();
            btn.disabled = false;
            btn.textContent = 'Verificar';
        }
    } catch (error) {
        mostrarMensaje('modal-mensaje', 'Error de conexión. Intenta de nuevo.', 'error');
        btn.disabled = false;
        btn.textContent = 'Verificar';
    }
}

// =========================================
// REGISTRO
// =========================================
document.getElementById('registro-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const usuario = document.getElementById('registro-usuario').value.trim();
    const contrasena = document.getElementById('registro-contrasena').value;
    const confirmar = document.getElementById('registro-confirmar').value;

    if (contrasena !== confirmar) return mostrarMensaje('registro-mensaje', 'Las contraseñas no coinciden', 'error');
    if (contrasena.length < 6) return mostrarMensaje('registro-mensaje', 'La contraseña debe tener al menos 6 caracteres', 'error');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando código...';

    try {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena })
        });
        const data = await response.json();

        if (data.exito && data.requiereVerificacion) {
            e.target.reset();
            mostrarModal(usuario);
        } else if (data.exito) {
            mostrarMensaje('registro-mensaje', data.mensaje, 'exito');
            e.target.reset();
        } else {
            mostrarMensaje('registro-mensaje', data.mensaje, 'error');
        }
    } catch {
        mostrarMensaje('registro-mensaje', 'Error de conexión.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Registrarse';
    }
});

// =========================================
// LOGIN
// =========================================
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const usuario = document.getElementById('login-usuario').value.trim();
    const contrasena = document.getElementById('login-contrasena').value;

    if (!usuario || !contrasena) return mostrarMensaje('login-mensaje', 'Por favor, completa todos los campos', 'error');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Iniciando sesión...';

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena })
        });
        const data = await response.json();

        if (data.exito) {
            mostrarMensaje('login-mensaje', `Bienvenido/a ${data.usuario} ✓`, 'exito');
            e.target.reset();
            sessionStorage.setItem('sesion', JSON.stringify({ usuario: data.usuario, fechaLogin: data.fechaLogin }));
            setTimeout(() => { window.location.href = '/dashboard.html'; }, 1000);
        } else {
            mostrarMensaje('login-mensaje', data.mensaje, 'error');
        }
    } catch {
        mostrarMensaje('login-mensaje', 'Error de conexión.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
    }
});

async function verificarConexion() {
    try {
        const r = await fetch(`${API_URL}/usuarios`);
        if (r.ok) console.log('✓ Conexión establecida');
    } catch {
        console.warn('⚠ Sin conexión con el servidor');
    }
}

// =========================================
// RECUPERAR CONTRASEÑA
// =========================================
let emailRecuperacion = '';

function abrirRecuperar() {
    document.getElementById('recuperar-email-input').value = '';
    document.getElementById('recuperar-email-mensaje').classList.remove('show');
    document.getElementById('modal-recuperar-email').style.display = 'flex';
}

function cerrarRecuperar(id) {
    document.getElementById(id).style.display = 'none';
}

async function enviarCodigoRecuperacion() {
    const email = document.getElementById('recuperar-email-input').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarMensaje('recuperar-email-mensaje', 'Ingresa un correo válido.', 'error');
        return;
    }

    const btn = document.querySelector('#modal-recuperar-email .btn-primary');
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const response = await fetch(`${API_URL}/recuperar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: email })
        });
        const data = await response.json();

        if (data.exito) {
            emailRecuperacion = email;
            cerrarRecuperar('modal-recuperar-email');
            document.getElementById('recuperar-codigo-email').textContent = email;
            document.querySelectorAll('#recuperar-digitos .codigo-digito').forEach(d => d.value = '');
            document.getElementById('recuperar-codigo-mensaje').classList.remove('show');
            document.getElementById('modal-recuperar-codigo').style.display = 'flex';
            setTimeout(() => document.querySelector('#recuperar-digitos .codigo-digito').focus(), 100);
        } else {
            mostrarMensaje('recuperar-email-mensaje', data.mensaje, 'error');
        }
    } catch {
        mostrarMensaje('recuperar-email-mensaje', 'Error de conexión.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar código';
    }
}

async function verificarCodigoRecuperacion() {
    const digitos = document.querySelectorAll('#recuperar-digitos .codigo-digito');
    const codigo = Array.from(digitos).map(d => d.value).join('');
    if (codigo.length < 6) {
        mostrarMensaje('recuperar-codigo-mensaje', 'Ingresa los 6 dígitos del código.', 'error');
        return;
    }

    const btn = document.querySelector('#modal-recuperar-codigo .btn-primary');
    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
        const response = await fetch(`${API_URL}/verificar-recuperacion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: emailRecuperacion, codigo })
        });
        const data = await response.json();

        if (data.exito) {
            cerrarRecuperar('modal-recuperar-codigo');
            document.getElementById('nueva-contrasena').value = '';
            document.getElementById('nueva-contrasena-confirmar').value = '';
            document.getElementById('recuperar-nueva-mensaje').classList.remove('show');
            document.getElementById('modal-recuperar-nueva').style.display = 'flex';
        } else {
            mostrarMensaje('recuperar-codigo-mensaje', data.mensaje, 'error');
            digitos.forEach(d => d.value = '');
            digitos[0].focus();
        }
    } catch {
        mostrarMensaje('recuperar-codigo-mensaje', 'Error de conexión.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Verificar código';
    }
}

async function reenviarCodigoRecuperacion() {
    const btn = document.querySelector('#modal-recuperar-codigo .btn-reenviar');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
        await fetch(`${API_URL}/recuperar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: emailRecuperacion })
        });
        mostrarMensaje('recuperar-codigo-mensaje', 'Código reenviado a tu correo ✓', 'exito');
    } catch {
        mostrarMensaje('recuperar-codigo-mensaje', 'Error de conexión.', 'error');
    } finally {
        setTimeout(() => { btn.disabled = false; btn.textContent = '¿No llegó? Reenviar código'; }, 4000);
    }
}

async function guardarNuevaContrasena() {
    const nueva = document.getElementById('nueva-contrasena').value;
    const confirmar = document.getElementById('nueva-contrasena-confirmar').value;

    if (nueva.length < 6) {
        mostrarMensaje('recuperar-nueva-mensaje', 'Mínimo 6 caracteres.', 'error');
        return;
    }
    if (nueva !== confirmar) {
        mostrarMensaje('recuperar-nueva-mensaje', 'Las contraseñas no coinciden.', 'error');
        return;
    }

    const btn = document.querySelector('#modal-recuperar-nueva .btn-primary');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        const response = await fetch(`${API_URL}/nueva-contrasena`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: emailRecuperacion, contrasena: nueva })
        });
        const data = await response.json();

        if (data.exito) {
            mostrarMensaje('recuperar-nueva-mensaje', '¡Contraseña actualizada correctamente! ✓', 'exito');
            setTimeout(() => {
                cerrarRecuperar('modal-recuperar-nueva');
                document.querySelectorAll('.tab-button')[1].click();
            }, 1500);
        } else {
            mostrarMensaje('recuperar-nueva-mensaje', data.mensaje, 'error');
        }
    } catch {
        mostrarMensaje('recuperar-nueva-mensaje', 'Error de conexión.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar contraseña';
    }
}

//funcion inicio seccion google!!

function manejarRespuestaGoogle(response) {
    const datos = parsearJWT(response.credential);

    // Guarda en el mismo formato que usa el dashboard
    sessionStorage.setItem('sesion', JSON.stringify({
        usuario: datos.name,
        email: datos.email,
        foto: datos.picture,
        fechaLogin: new Date().toISOString()
    }));

    // Muestra mensaje de éxito
    const mensaje = document.getElementById('login-mensaje');
    mensaje.className = 'mensaje exito show';
    mensaje.textContent = `✅ Bienvenido, ${datos.name}!`;

    // Redirige al dashboard
    setTimeout(() => {
        window.location.href = '/dashboard.html';
    }, 1500);
}

function parsearJWT(token) {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
}
