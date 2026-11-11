window.addEventListener('DOMContentLoaded', () => {
    verificarRolUsuario();
    cargarDatosCompletos();
});

function verificarRolUsuario() {
    const rol = localStorage.getItem('rol_usuario') || 'Administrador';
    const indicador = document.getElementById('indicadorRol');
    const icono = rol.toLowerCase() === 'administrador' ? '🛡️' : '👤';
    indicador.innerHTML = `<span style="font-size: 22px;">${icono}</span> <span>Rol: ${rol.toUpperCase()}</span>`;
}

function obtenerAdminsLocales() {
    let admins = localStorage.getItem('lista_admins');
    return admins ? JSON.parse(admins) : [];
}

function cargarDatosCompletos() {
    fetch('http://127.0.0.1:8000/auth/administradores/')
        .then(res => res.json())
        .then(admins => {
            renderizarAdministradores(admins);
            
            const adminsLocales = obtenerAdminsLocales();
            const nombresAdmins = admins.map(a => a.username.toLowerCase());

            let pacientesOcultos = localStorage.getItem('pacientes_ocultos');
            pacientesOcultos = pacientesOcultos ? JSON.parse(pacientesOcultos) : [];

            fetch('http://127.0.0.1:8000/auth/clientes/')
                .then(res => res.json())
                .then(clientes => {
                    const pacientesReales = clientes.filter(c => {
                        const username = c.username.toLowerCase();
                        const estaOculto = pacientesOcultos.includes(c.id_cliente);

                        return !estaOculto && 
                               !nombresAdmins.includes(username) && 
                               !adminsLocales.includes(username) && 
                               !username.includes('admin');
                    });
                    renderizarPacientes(pacientesReales);
                });
        })
        .catch(err => console.error("Error cargando usuarios:", err));

    cargarTiposEstres();
}

function renderizarPacientes(pacientes) {
    const tbody = document.querySelector('#tablaPacientes tbody');
    tbody.innerHTML = '';
    
    if(!pacientes || pacientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay pacientes registrados.</td></tr>`;
        return;
    }

    pacientes.forEach(cliente => {
        tbody.innerHTML += `
            <tr>
                <td>${cliente.id_cliente}</td>
                <td>${cliente.username}</td>
                <td>${cliente.nombre}</td>
                <td>
                    <button class="btn btn-secundario" style="padding: 4px 8px; font-size: 11px; margin-right: 5px;" onclick="verHistorial(${cliente.id_cliente}, '${cliente.nombre}')">Historial</button>
                    <button class="btn" style="background-color: #ff4757; color: white; padding: 4px 8px; font-size: 11px; border:none; border-radius:5px; cursor:pointer;" onclick="eliminarCliente(${cliente.id_cliente})">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

function renderizarAdministradores(admins) {
    const tbody = document.querySelector('#tablaAdministradores tbody');
    tbody.innerHTML = '';
    
    const adminsLocales = obtenerAdminsLocales().map((username) => ({
        id_administrador: `--`, 
        username: username,
        nombre: "Administrador (Local)"
    }));

    const todosAdmins = [...admins, ...adminsLocales];

    if(todosAdmins.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay administradores registrados.</td></tr>`;
        return;
    }

    todosAdmins.forEach(admin => {
        tbody.innerHTML += `
            <tr>
                <td>${admin.id_administrador}</td>
                <td>${admin.username}</td>
                <td>${admin.nombre}</td>
                <td>
                    <button class="btn" style="background-color: #ff4757; color: white; padding: 4px 8px; font-size: 11px; border:none; border-radius:5px; cursor:pointer;" onclick="eliminarAdminPorNombre('${admin.username}')">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

function cargarTiposEstres() {
    fetch('http://127.0.0.1:8000/api/tipos-estres/')
    .then(res => res.json())
    .then(data => {
        const tbody = document.querySelector('#tablaTiposEstres tbody');
        tbody.innerHTML = '';
        
        if(!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay tipos de estrés registrados.</td></tr>`;
            return;
        }

        data.forEach(estres => {
            const idEstres = estres.id_nivel_estres;
            tbody.innerHTML += `
                <tr>
                    <td>${idEstres}</td>
                    <td>${estres.nivel_estres}</td>
                    <td>${estres.tipo_estres}</td>
                    <td>
                        <button class="btn" style="background-color: #ff4757; color: white; padding: 4px 8px; font-size: 11px; border:none; border-radius:5px; cursor:pointer;" onclick="eliminarTipoEstres(${idEstres})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    })
    .catch(err => console.error("Error cargando catálogo de estrés:", err));
}

document.getElementById('formTipoEstres').addEventListener('submit', function(e) {
    e.preventDefault();
    const msj = document.getElementById('msjEstres');
    
    const datos = {
        nivel_estres: document.getElementById('inputNivel').value,
        tipo_estres: document.getElementById('inputTipo').value
    };

    fetch('http://127.0.0.1:8000/api/tipos-estres/crear/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => {
        if(res.ok) {
            msj.style.color = "green";
            msj.textContent = "¡Tipo de estrés guardado!";
            document.getElementById('formTipoEstres').reset();
            cargarTiposEstres();
            setTimeout(() => msj.textContent = "", 3000);
        } else {
            return res.json().then(err => { throw new Error(err.error || "Error al guardar"); });
        }
    })
    .catch(err => {
        msj.style.color = "red";
        msj.textContent = "Error: " + err.message;
    });
});

document.getElementById('formNuevoUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    const msj = document.getElementById('msjUsuario');
    const rol = document.getElementById('tipoRol').value;
    const usernameInput = document.getElementById('nuevoUsername').value;
    
    const endpoint = rol === 'administrador' 
        ? 'http://127.0.0.1:8000/auth/administrador/crear/' 
        : 'http://127.0.0.1:8000/auth/clientes/crear/';

    const datos = {
        username: usernameInput,
        nombre: document.getElementById('nuevoNombre').value,
        email: usernameInput + "@sistema.com",
        password: document.getElementById('nuevoPassword').value
    };

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(res => {
        if(res.status === 201 || res.status === 200) {
            msj.style.color = "green";
            msj.textContent = `¡${rol.toUpperCase()} creado con éxito!`;
            
            if (rol === 'administrador') {
                let adminsLocales = obtenerAdminsLocales();
                adminsLocales.push(usernameInput.toLowerCase());
                localStorage.setItem('lista_admins', JSON.stringify(adminsLocales));
            }

            document.getElementById('formNuevoUsuario').reset();
            cargarDatosCompletos();
            setTimeout(() => msj.textContent = "", 3000);
        } else {
            msj.style.color = "red";
            let mensajeError = "Error desconocido";
            if (res.body.error) mensajeError = res.body.error;
            else if (res.body.username) mensajeError = "El nombre de usuario ya existe.";
            else if (res.body.password) mensajeError = "La contraseña es muy corta (mínimo 8).";
            else mensajeError = JSON.stringify(res.body);
            
            msj.textContent = mensajeError;
        }
    })
    .catch(err => {
        msj.style.color = "red";
        msj.textContent = "Error de conexión con el servidor.";
    });
});

function eliminarCliente(idCliente) {
    if (confirm("¿Estás segura de ocultar a este paciente de la vista?")) {
        let pacientesOcultos = localStorage.getItem('pacientes_ocultos');
        pacientesOcultos = pacientesOcultos ? JSON.parse(pacientesOcultos) : [];

        if (!pacientesOcultos.includes(idCliente)) {
            pacientesOcultos.push(idCliente);
            localStorage.setItem('pacientes_ocultos', JSON.stringify(pacientesOcultos));
        }

        cargarDatosCompletos();
        alert("Paciente oculto de la interfaz. (Sigue en la base de datos)");
    }
}

function eliminarAdminPorNombre(username) {
    if (confirm(`¿Estás segura de ocultar de la vista al administrador ${username}?`)) {
        let adminsLocales = obtenerAdminsLocales();
        adminsLocales = adminsLocales.filter(u => u !== username.toLowerCase());
        localStorage.setItem('lista_admins', JSON.stringify(adminsLocales));
        
        cargarDatosCompletos();
        alert("Administrador oculto de la interfaz. (Sigue en la base de datos)");
    }
}

function eliminarTipoEstres(idEstres) {
    if (confirm("¿Estás segura de eliminar este tipo de estrés?")) {
        fetch(`http://127.0.0.1:8000/api/tipos-estres/actualizar/${idEstres}/`, { method: 'DELETE' })
        .then(() => cargarTiposEstres())
        .catch(() => cargarTiposEstres());
    }
}

function verHistorial(idCliente, nombreCliente) {
    document.getElementById('tituloHistorial').textContent = `Historial de: ${nombreCliente}`;
    document.getElementById('seccionHistorial').style.display = 'block';
    
    const tbody = document.querySelector('#tablaHistorial tbody');
    tbody.innerHTML = '';
    
    // 1. Obtenemos la fecha actual
    const hoy = new Date();
    const fechaFormateada = hoy.toLocaleDateString() + " " + hoy.toLocaleTimeString();

    // 2. Creamos una fila de prueba directa
    // (Si quieres que salgan más filas, solo copia este "tbody.innerHTML +=" varias veces)
    tbody.innerHTML += `
        <tr>
            <td>${fechaFormateada}</td>
            <td>75 BPM</td>
            <td style="color: #f59e0b;"><strong>Medio (Simulado)</strong></td>
        </tr>
        <tr>
            <td>Ayer 10:30 AM</td>
            <td>80 BPM</td>
            <td style="color: #ef4444;"><strong>Alto (Simulado)</strong></td>
        </tr>
    `;
}

function cerrarHistorial() {
    document.getElementById('seccionHistorial').style.display = 'none';
}

function cerrarSesion() {
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('id_evaluacion');
    window.location.href = 'login.html';
}

function cambiarVista(idVista, evento) {
    if (evento) evento.preventDefault();

    const secciones = document.querySelectorAll('.vista-seccion');
    secciones.forEach(sec => sec.style.display = 'none');

    const seccionActiva = document.getElementById(`vista-${idVista}`);
    if (seccionActiva) {
        seccionActiva.style.display = 'block';
    }

    const links = document.querySelectorAll('.sidebar-nav .nav-item');
    links.forEach(link => link.classList.remove('activo'));
    
    if (evento && evento.currentTarget) {
        evento.currentTarget.classList.add('activo');
    }
}