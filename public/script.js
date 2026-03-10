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

document.addEventListener('DOMContentLoaded', function () {
    const digitos = document.querySelectorAll('.codigo-digito');

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

    verificarConexion();
});

async function verificarCodigo() {
    const digitos = document.querySelectorAll('.codigo-digito');
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
