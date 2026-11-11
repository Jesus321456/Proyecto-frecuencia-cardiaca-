document.addEventListener('DOMContentLoaded', () => {
    const usuarioId = localStorage.getItem('id_usuario');

    if (!usuarioId) {
        alert("No hay sesión activa. Redirigiendo al login...");
        window.location.href = 'login.html';
        return;
    }

    const formPerfil = document.getElementById('formPerfilPaciente');
    const cajaMensajePerfil = document.getElementById('msjPerfil');
    const boton = formPerfil.querySelector('button[type="submit"]');

    formPerfil.addEventListener('submit', async function(e) {
        e.preventDefault(); // Evita que la página intente recargarse

        const edadVal = document.getElementById('edad').value.trim();
        const generoVal = document.getElementById('genero').value;
        const ocupacionVal = document.getElementById('ocupacion').value; // Ahora lee del <select>
        const pesoVal = document.getElementById('peso').value.trim();
        const estaturaVal = document.getElementById('estatura').value.trim();

        if (!edadVal || !generoVal || !ocupacionVal || !pesoVal || !estaturaVal) {
            mostrarMensaje("⚠️ Completa todos los campos.", "red");
            return;
        }

        boton.disabled = true;
        mostrarMensaje("Guardando datos...", "black");

        const datosPerfil = {
            edad: parseInt(edadVal),
            genero: generoVal,
            ocupacion: ocupacionVal,
            peso: parseFloat(pesoVal),
            estatura: parseFloat(estaturaVal)
        };

        try {
            const response = await fetch(`http://127.0.0.1:8000/evaluaciones/actualizar/${usuarioId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosPerfil)
            });

            if (!response.ok) {
                // Protección contra errores HTML de Django
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const err = await response.json();
                    throw new Error(err.error || "Error al guardar perfil");
                } else {
                    throw new Error(`Fallo en el servidor (HTTP ${response.status}). Revisa la pestaña Network.`);
                }
            }

            // Si fue exitoso, hacemos la redirección física a form2
            window.location.href = 'form2.html';

        } catch (error) {
            boton.disabled = false;
            mostrarMensaje("Error: " + error.message, "red");
        }
    });

    // Función auxiliar para manejar el cuadro de mensajes (que en tu HTML arranca oculto)
    function mostrarMensaje(texto, color) {
        cajaMensajePerfil.style.display = "block";
        cajaMensajePerfil.style.color = color;
        cajaMensajePerfil.textContent = texto;
    }
});

function cerrarSesion() {
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('id_evaluacion');
    window.location.href = 'login.html';
}