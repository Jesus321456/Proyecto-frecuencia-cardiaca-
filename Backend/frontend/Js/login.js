function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


document.getElementById('formularioLogin').addEventListener('submit', function(e) {
    e.preventDefault();
    const csrftoken = getCookie('csrftoken');
    const usuarioInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;
    const cajaMensaje = document.getElementById('mensaje');

    cajaMensaje.style.color = "black";
    cajaMensaje.textContent = "Validando credenciales...";

    fetch('/auth/login/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken 
         },
        body: JSON.stringify({ username: usuarioInput, password: passwordInput })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(res => {
        if (res.status === 200) {
            cajaMensaje.style.color = "green";
            cajaMensaje.textContent = "¡" + res.body.mensaje + "! Redirigiendo...";
            
            localStorage.setItem('id_usuario', res.body.id_usuario);
            localStorage.setItem('rol_usuario', res.body.rol);
            localStorage.setItem('nombre', res.body.nombre);
            
            setTimeout(() => {
                if (res.body.rol && res.body.rol.toLowerCase() === 'administrador') {
                    window.location.href = '/panel_admin/';
                } else {
                    window.location.href = '/formulario_uno/';
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