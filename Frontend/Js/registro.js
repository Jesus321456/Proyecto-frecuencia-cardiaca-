document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const cajaMensaje = document.getElementById('msjLogin');

    if (formLogin) {
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const usernameInput = document.getElementById('loginUsuario').value.trim();
            const passwordInput = document.getElementById('loginPassword').value.trim();
            const botonSubmit = formLogin.querySelector('button[type="submit"]');

            if (!usernameInput || !passwordInput) {
                if (cajaMensaje) {
                    cajaMensaje.style.color = "red";
                    cajaMensaje.textContent = "Por favor, ingresa tu usuario y contraseña.";
                }
                return;
            }

            if (botonSubmit) botonSubmit.disabled = true;

            if (cajaMensaje) {
                cajaMensaje.style.color = "black";
                cajaMensaje.textContent = "Iniciando sesión...";
            }

            const credenciales = {
                username: usernameInput,
                password: passwordInput
            };

            try {
                const response = await fetch('http://127.0.0.1:8000/auth/login/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(credenciales)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Usuario o contraseña incorrectos.");
                }

                if (data.id_usuario) {
                    localStorage.setItem('id_usuario', data.id_usuario);
                }
                if (data.rol) {
                    localStorage.setItem('rol', data.rol);
                }

                if (cajaMensaje) {
                    cajaMensaje.style.color = "green";
                    cajaMensaje.textContent = "¡Bienvenido! Redirigiendo...";
                }

                setTimeout(() => {
                    window.location.href = 'evaluacion.html';
                }, 1000);

            } catch (error) {
                if (botonSubmit) botonSubmit.disabled = false;
                if (cajaMensaje) {
                    cajaMensaje.style.color = "red";
                    cajaMensaje.textContent = "Error: " + error.message;
                }
                console.error("Error en login:", error);
            }
        });
    }
});