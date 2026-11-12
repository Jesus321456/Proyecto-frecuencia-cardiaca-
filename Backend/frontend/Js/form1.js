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
    const usuarioId = localStorage.getItem('id_usuario');
    verificarRolUsuario();


    if (!usuarioId) {
        toastError("No hay sesión activa. Redirigiendo al login...");
        setTimeout(() => { window.location.href = '/login/'; }, 2000);
        return;
    }

    const formPerfil = document.getElementById('formPerfilPaciente');
    const boton = formPerfil.querySelector('button[type="submit"]');


    formPerfil.addEventListener('submit', async function(e) {
        e.preventDefault();

        const edadVal = document.getElementById('edad').value.trim();
        const generoVal = document.getElementById('genero').value;
        const ocupacionVal = document.getElementById('ocupacion').value; 
        const estaturaVal = document.getElementById('estatura').value.trim();
          const pesoVal = document.getElementById('peso').value.trim();

        if (!edadVal || !generoVal || !ocupacionVal || !pesoVal || !estaturaVal) {
            toastError("Completa todos los campos.");
            return;
        }

        boton.disabled = true;
        toastInfo("Guardando datos..."); 

        const datosPerfil = {
            edad: parseInt(edadVal),
            genero: generoVal,
            ocupacion: ocupacionVal,
            peso: parseFloat(pesoVal),
            estatura: parseFloat(estaturaVal)
        };

        try {
            const response = await fetch(`/evaluaciones/actualizar/${usuarioId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                 },
                body: JSON.stringify(datosPerfil)
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const err = await response.json();
                    throw new Error(err.error || "Error al guardar perfil");
                } else {
                    throw new Error(`Fallo en el servidor (HTTP ${response.status}). Revisa la pestaña Network.`);
                }
            }

            toastExito("Datos guardados correctamente. Redirigiendo a la siguiente sección...");
            setTimeout(() => { window.location.href = '/formulario_dos/';}, 1500);


        } catch (error) {
            boton.disabled = false;
            toastError("Error: " + error.message);
        }
    });
});


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
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('id_evaluacion');
    window.location.href = '/login/';
}

function verificarRolUsuario() {
    const nombre = localStorage.getItem('nombre') || 'Paciente Nuevo'; 
    const elementoNombre = document.getElementById('nombreUsuario');
    const elementoAvatar = document.getElementById('avatarUsuario');

    if (elementoNombre && elementoAvatar) {
        elementoNombre.textContent = nombre;
        elementoAvatar.textContent = nombre.substring(0, 2).toUpperCase(); 
    }
}