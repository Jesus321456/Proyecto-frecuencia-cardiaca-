function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

document.addEventListener('DOMContentLoaded', () => {
    verificarRolUsuario();

    const formulario = document.getElementById('formEstiloVida');

    if (!formulario) {
        console.error("No se encontró el formulario con ID 'formEstiloVida'.");
        return;
    }

    formulario.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const usuarioId = localStorage.getItem('id_usuario');


        if (!usuarioId) {
            toastError("No hay sesión activa. Regresando al login...");
            setTimeout(() => { window.location.href = '/login/'; }, 2000);
            return;
        }


        try {
            const datosEstiloVida = {
                hora_sueno: parseFloat(document.getElementById('horas_sueno').value) || 0, 
                calidad_sueno: parseInt(document.getElementById('calidad_sueno').value) || 0,
                nivel_actividad: parseInt(document.getElementById('nivel_actividad').value) || 0,
                pasos_diarios: parseInt(document.getElementById('pasos_diarios').value) || 0,
                trastorno_sueno: document.getElementById('trastorno_sueno').value
            };
            
            toastInfo("Guardando estilo de vida...");

            const response = await fetch(`/evaluaciones/crear/${usuarioId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                 },
                body: JSON.stringify(datosEstiloVida)
            });

            if (!response.ok) {
                const textoError = await response.text();
                console.error("Respuesta del servidor:", textoError);
                throw new Error("Error al guardar en el servidor. Revisa la consola.");
            }

            const data = await response.json();

            if (data.id_evaluacion) {
                localStorage.setItem('id_evaluacion', data.id_evaluacion);
                
                toastExito("¡Estilo de vida guardado! Redirigiendo al sensor...");
                
                setTimeout(() => {
                    window.location.href = '/sensor/'; 
                }, 1500);
            } else {
                throw new Error("Django respondió bien, pero no envió el 'id_evaluacion'.");
            }

        } catch (error) {
            console.error(error);
            toastError(error.message || "Ocurrió un error inesperado al guardar.");
        }
    });
});


function verificarRolUsuario() {
    const nombre = localStorage.getItem('nombre') || 'Paciente Nuevo'; 
    const elementoNombre = document.getElementById('nombreUsuario');
    const elementoAvatar = document.getElementById('avatarUsuario');

    if (elementoNombre && elementoAvatar) {
        elementoNombre.textContent = nombre;
        elementoAvatar.textContent = nombre.substring(0, 2).toUpperCase(); 
    }
}

function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;

    const toast = document.createElement('div');
    toast.className = `toast-custom toast-${tipo}`;
    toast.innerHTML = `</span><span>${mensaje}</span>`;

    contenedor.appendChild(toast);
    
    requestAnimationFrame(() => toast.classList.add('mostrar'));

    setTimeout(() => {
        toast.classList.remove('mostrar');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duracion);
}

function toastExito(msg) { mostrarToast(msg, 'exito'); }
function toastError(msg) { mostrarToast(msg, 'error', 4000); } 
function toastInfo(msg)  { mostrarToast(msg, 'info'); }

function cerrarSesion() {
    localStorage.clear();
    window.location.href = '/login/';
}