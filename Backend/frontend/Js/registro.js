
document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('formRegistro');
    const mensajeRegistro = document.getElementById('mensajeRegistro');

    if (formRegistro) {
        const csrfInput = formRegistro.querySelector('[name="csrfmiddlewaretoken"]');
        const csrfToken = csrfInput ? csrfInput.value : '';

        formRegistro.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const nombre = document.getElementById('reg_nombre').value.trim();
            const email = document.getElementById('reg_email').value.trim();
            const username = document.getElementById('reg_usuario').value.trim();
            const password = document.getElementById('reg_password').value.trim();

            const botonSubmit = formRegistro.querySelector('button[type="submit"]');

            if (!nombre || !email || !username || !password) {
                if (mensajeRegistro) {
                    mensajeRegistro.style.color = "red";
                    mensajeRegistro.textContent = "Todos los campos son obligatorios.";
                }
                return;
            }

            if (!csrfToken) {
                if (mensajeRegistro) {
                    mensajeRegistro.style.color = "red";
                    mensajeRegistro.textContent = "No se encontró el token de seguridad.";
                }
                return;
            }

            if (botonSubmit) botonSubmit.disabled = true;

            if (mensajeRegistro) {
                mensajeRegistro.style.color = "black";
                mensajeRegistro.textContent = "Registrando usuario...";
            }

            const datosRegistro = {
                nombre: nombre,
                email: email,
                username: username,
                password: password
            };

            try {
                const response = await fetch('/auth/clientes/crear/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken
                    },
                    body: JSON.stringify(datosRegistro)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "No fue posible registrar al usuario.");
                }

                if (mensajeRegistro) {
                    mensajeRegistro.style.color = "green";
                    mensajeRegistro.textContent = "¡Registro exitoso! Redirigiendo al login...";
                }

                setTimeout(() => {
                    window.location.href = '/login/';
                }, 1000);

            } catch (error) {
                if (botonSubmit) botonSubmit.disabled = false;

                if (mensajeRegistro) {
                    mensajeRegistro.style.color = "red";
                    mensajeRegistro.textContent = "Error: " + error.message;
                }

                console.error("Error en registro:", error);
            }
        });
    }
});
