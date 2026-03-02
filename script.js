// =========================================
// LÓGICA DEL CLIENTE - SISTEMA DE AUTENTICACIÓN
// =========================================

// Configuración de la URL base de la API
const API_URL = '/api';

// =========================================
// FUNCIONES DE NAVEGACIÓN DE PESTAÑAS
// =========================================

/**
 * Función para cambiar entre pestañas (Registro / Login)
 * @param {string} tabName - Nombre de la pestaña ('registro' o 'login')
 */
function mostrarTab(tabName) {
    // Obtiene todos los contenidos de pestañas
    const tabs = document.querySelectorAll('.tab-content');
    // Obtiene todos los botones de pestañas
    const buttons = document.querySelectorAll('.tab-button');
    
    // Oculta todos los contenidos de pestañas
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desactiva todos los botones de pestañas
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Muestra la pestaña seleccionada
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activa el botón correspondiente
    event.target.classList.add('active');
    
    // Limpia los mensajes al cambiar de pestaña
    limpiarMensajes();
}

// =========================================
// FUNCIONES DE MENSAJES
// =========================================

/**
 * Muestra un mensaje en el área de mensajes especificada
 * @param {string} elementId - ID del elemento donde mostrar el mensaje
 * @param {string} mensaje - Texto del mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje ('exito' o 'error')
 */
function mostrarMensaje(elementId, mensaje, tipo) {
    const mensajeDiv = document.getElementById(elementId);
    
    // Establece el contenido del mensaje
    mensajeDiv.textContent = mensaje;
    
    // Remueve clases anteriores
    mensajeDiv.classList.remove('exito', 'error', 'show');
    
    // Agrega las nuevas clases
    mensajeDiv.classList.add(tipo, 'show');
    
    // Auto-ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        mensajeDiv.classList.remove('show');
    }, 5000);
}

/**
 * Limpia todos los mensajes de la página
 */
function limpiarMensajes() {
    const mensajes = document.querySelectorAll('.mensaje');
    mensajes.forEach(mensaje => {
        mensaje.classList.remove('show');
    });
}

/**
 * Limpia un formulario específico
 * @param {HTMLFormElement} form - El formulario a limpiar
 */
function limpiarFormulario(form) {
    form.reset();
}

// =========================================
// MANEJO DEL FORMULARIO DE REGISTRO
// =========================================

/**
 * Event listener para el formulario de registro
 */
document.getElementById('registro-form').addEventListener('submit', async function(e) {
    // Previene el comportamiento por defecto del formulario
    e.preventDefault();
    
    // Obtiene los valores de los campos
    const usuario = document.getElementById('registro-usuario').value.trim();
    const contrasena = document.getElementById('registro-contrasena').value;
    const confirmar = document.getElementById('registro-confirmar').value;
    
    // Validación: Verifica que las contraseñas coincidan
    if (contrasena !== confirmar) {
        mostrarMensaje('registro-mensaje', 'Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Validación: Longitud mínima del usuario
    if (usuario.length < 3) {
        mostrarMensaje('registro-mensaje', 'El usuario debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    // Validación: Longitud mínima de la contraseña
    if (contrasena.length < 6) {
        mostrarMensaje('registro-mensaje', 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Deshabilita el botón mientras se procesa
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';
    
    try {
        // Realiza la petición POST al endpoint de registro
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: usuario,
                contrasena: contrasena
            })
        });
        
        // Parsea la respuesta JSON
        const data = await response.json();
        
        // Verifica si el registro fue exitoso
        if (data.exito) {
            // Muestra mensaje de éxito
            mostrarMensaje('registro-mensaje', data.mensaje, 'exito');
            
            // Limpia el formulario
            limpiarFormulario(e.target);
            
            // Opcional: Cambia automáticamente a la pestaña de login después de 2 segundos
            setTimeout(() => {
                document.querySelectorAll('.tab-button')[1].click();
            }, 2000);
            
        } else {
            // Muestra mensaje de error
            mostrarMensaje('registro-mensaje', data.mensaje, 'error');
        }
        
    } catch (error) {
        // Manejo de errores de red o servidor
        console.error('Error:', error);
        mostrarMensaje('registro-mensaje', 
            'Error de conexión. Por favor, verifica que el servidor esté funcionando.', 
            'error');
    } finally {
        // Re-habilita el botón
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrarse';
    }
});

// =========================================
// MANEJO DEL FORMULARIO DE INICIO DE SESIÓN
// =========================================

/**
 * Event listener para el formulario de login
 */
document.getElementById('login-form').addEventListener('submit', async function(e) {
    // Previene el comportamiento por defecto del formulario
    e.preventDefault();
    
    // Obtiene los valores de los campos
    const usuario = document.getElementById('login-usuario').value.trim();
    const contrasena = document.getElementById('login-contrasena').value;
    
    // Validación: Verifica que los campos no estén vacíos
    if (!usuario || !contrasena) {
        mostrarMensaje('login-mensaje', 'Por favor, completa todos los campos', 'error');
        return;
    }
    
    // Deshabilita el botón mientras se procesa
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';
    
    try {
        // Realiza la petición POST al endpoint de login
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario: usuario,
                contrasena: contrasena
            })
        });
        
        // Parsea la respuesta JSON
        const data = await response.json();
        
        // Verifica si la autenticación fue exitosa
        if (data.exito) {
            // Muestra mensaje de éxito
            mostrarMensaje('login-mensaje', 
                `${data.mensaje}! Bienvenido/a ${data.usuario}`, 
                'exito');
            
            // Limpia el formulario
            limpiarFormulario(e.target);

            // Guarda los datos de sesión
            sessionStorage.setItem('sesion', JSON.stringify({
                usuario: data.usuario,
                fechaLogin: data.fechaLogin
            }));

            // Redirige al dashboard después de 1 segundo
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
            
        } else {
            // Muestra mensaje de error
            mostrarMensaje('login-mensaje', data.mensaje, 'error');
        }
        
    } catch (error) {
        // Manejo de errores de red o servidor
        console.error('Error:', error);
        mostrarMensaje('login-mensaje', 
            'Error de conexión. Por favor, verifica que el servidor esté funcionando.', 
            'error');
    } finally {
        // Re-habilita el botón
        submitBtn.disabled = false;
        submitBtn.textContent = 'Iniciar Sesión';
    }
});

// =========================================
// INICIALIZACIÓN
// =========================================

/**
 * Código que se ejecuta cuando la página termina de cargar
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de autenticación cargado correctamente');
    console.log('API URL:', API_URL);
    
    // Opcional: Verificar conexión con el servidor
    verificarConexion();
});

/**
 * Verifica si el servidor está disponible
 */
async function verificarConexion() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        if (response.ok) {
            console.log('✓ Conexión con el servidor establecida');
        }
    } catch (error) {
        console.warn('⚠ No se pudo conectar con el servidor');
        console.warn('Asegúrate de que el servidor esté ejecutándose en el puerto 3000');
    }
}
