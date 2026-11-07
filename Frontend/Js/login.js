document.getElementById('formularioLogin').addEventListener('submit', function(e) {
    e.preventDefault();

    const usuarioInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const cajaMensaje = document.getElementById('mensaje');

    cajaMensaje.style.color = "black";
    cajaMensaje.textContent = "Validando credenciales...";

    fetch('http://127.0.0.1:8000/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuarioInput, password: passwordInput })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(res => {
        if (res.status === 200) {
            cajaMensaje.style.color = "green";
            cajaMensaje.textContent = "¡" + res.body.mensaje + "! Redirigiendo...";
            
            localStorage.setItem('id_usuario', res.body.id_usuario);
            localStorage.setItem('rol_usuario', res.body.rol);
            
            // Redirección
            setTimeout(() => {
                if (res.body.rol === 'administrador') {
                    window.location.href = 'panel_admin.html';
                } else {
                    window.location.href = 'evaluacion.html';
                }
            }, 1000);
            
        } else {
            cajaMensaje.style.color = "red";
            cajaMensaje.textContent = "Error: " + (res.body.error || "Credenciales incorrectas");
        }
    })
    .catch(error => {
        cajaMensaje.style.color = "red";
        cajaMensaje.textContent = "Error de conexión con el servidor.";
        console.error("Error:", error);
    });
});