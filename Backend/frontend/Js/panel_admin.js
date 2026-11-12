// ============================================================
// panel_admin.js — versión completa y funcional
// ============================================================

// --- Helper CSRF (cookie con fallback a <meta>) ---
function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    if (m) return m.pop();
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

window.addEventListener('DOMContentLoaded', () => {
    inyectarUI();
    verificarRolUsuario();
    cargarDatosCompletos();
});

function inyectarUI() {
    if (!document.getElementById('toast-container')) {
        const tc = document.createElement('div');
        tc.id = 'toast-container';
        document.body.appendChild(tc);
    }

    if (!document.getElementById('modalConfirm')) {
        const dlg = document.createElement('dialog');
        dlg.id = 'modalConfirm';
        dlg.className = 'modal-custom';
        dlg.setAttribute('aria-labelledby', 'modalTitulo');
        dlg.innerHTML = `
            <h3 id="modalTitulo">¿Eliminar?</h3>
            <p id="modalTexto">Esta acción no se puede deshacer.</p>
            <div class="modal-acciones">
                <button type="button" id="btnCancelar" class="btn btn-secundario">Cancelar</button>
                <button type="button" id="btnAceptar"  class="btn btn-peligro">Sí, eliminar</button>
            </div>
        `;
        document.body.appendChild(dlg);
    }

    // Modal de edición de tipos de estrés
     if (!document.getElementById('modalEditarEstres')) {
        const dlg = document.createElement('dialog');
        dlg.id = 'modalEditarEstres';
        dlg.className = 'modal-custom';
        dlg.innerHTML = `
            <div class="modal-header">
                <h3>Editar tipo de estrés</h3>
                <button type="button" class="btn-cerrar-modal" id="btnCerrarModalEdit">&times;</button>
            </div>
            <form id="formEditarEstres">
                <input type="hidden" id="editIdEstres">
                
                <div class="grupo-form">
                    <label for="editNivel">Nivel de Estrés</label>
                    <input type="text" id="editNivel" required autocomplete="off">
                </div>
                
                <div class="grupo-form">
                    <label for="editTipo">Tipo de Estrés</label>
                    <input type="text" id="editTipo" required autocomplete="off">
                </div>
                
                <div class="modal-acciones">
                    <button type="button" id="btnCancelarEdit" class="btn btn-secundario">Cancelar</button>
                    <button type="submit" class="btn btn-primario">Guardar Cambios</button>
                </div>
            </form>
        `;
        document.body.appendChild(dlg);
        
        document.getElementById('btnCerrarModalEdit').onclick = () => dlg.close();
        document.getElementById('btnCancelarEdit').onclick = () => dlg.close();
        document.getElementById('formEditarEstres').addEventListener('submit', guardarEdicionEstres);
    }

}

function mostrarToast(mensaje, tipo = 'info', duracion = 3000) {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;

    const toast = document.createElement('div');
    toast.className = `toast-custom toast-${tipo}`;
    toast.innerHTML = `<span>${mensaje}</span>`;
    contenedor.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('mostrar'));

    setTimeout(() => {
        toast.classList.remove('mostrar');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duracion);
}

function toastExito(msg) { mostrarToast(msg, 'exito'); }
function toastError(msg) { mostrarToast(msg, 'error'); }

function confirmarBorrado(titulo, texto, textoAceptar = 'Sí, eliminar') {
    return new Promise(resolve => {
        const modal  = document.getElementById('modalConfirm');
        const btnOk  = document.getElementById('btnAceptar');
        const btnNo  = document.getElementById('btnCancelar');

        document.getElementById('modalTitulo').textContent = titulo;
        document.getElementById('modalTexto').textContent  = texto;
        btnOk.textContent = textoAceptar;

        const cerrar = (valor) => {
            modal.close();
            btnOk.onclick = null;
            btnNo.onclick = null;
            resolve(valor);
        };
        btnOk.onclick = () => cerrar(true);
        btnNo.onclick = () => cerrar(false);

        modal.showModal();
        btnNo.focus();
    });
}


function verificarRolUsuario() {
    const rol = localStorage.getItem('rol_usuario') || 'Administrador';
    const nombreAdmin = localStorage.getItem('nombre') || 'Admin';

    const indicador = document.getElementById('indicadorRol');
    if (indicador) {
        const icono = rol.toLowerCase() === 'administrador'
            ? '/static/img/administrador.png'
            : '/static/img/paciente.png';
        indicador.innerHTML = `<img src="${icono}" class="nav-icon-custom"> <span>Rol: ${rol.toUpperCase()}</span>`;
    }

    const elementoNombre = document.getElementById('nombreUsuario');
    const elementoAvatar = document.getElementById('avatarUsuario');

    if (elementoNombre && elementoAvatar) {
        elementoNombre.textContent = nombreAdmin;
        elementoAvatar.textContent = nombreAdmin.substring(0, 2).toUpperCase();
    }
}

function obtenerAdminsLocales() {
    const admins = localStorage.getItem('lista_admins');
    return admins ? JSON.parse(admins) : [];
}

function cargarDatosCompletos() {
    fetch('/auth/administradores/', { cache: 'no-store' })
        .then(res => res.json())
        .then(admins => {
            renderizarAdministradores(admins);

            const nombresAdmins = admins.map(a => a.username.toLowerCase());

            fetch('/auth/clientes/', { cache: 'no-store' })
                .then(res => res.json())
                .then(clientes => {
                    const pacientesReales = clientes.filter(c => {
                        const username = c.username.toLowerCase();
                        return !nombresAdmins.includes(username) &&
                               !username.includes('admin');
                    });
                    renderizarPacientes(pacientesReales);
                })
                .catch(err => console.error("Error cargando clientes:", err));
        })
        .catch(err => console.error("Error cargando administradores:", err));

    cargarTiposEstres();
}


function renderizarPacientes(pacientes) {
    const tbody = document.querySelector('#tablaPacientes tbody');
    tbody.innerHTML = '';

    if (!pacientes || pacientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay pacientes registrados.</td></tr>`;
        return;
    }

    pacientes.forEach(cliente => {
        tbody.innerHTML += `
            <tr>
                <td>${cliente.id_cliente}</td>
                <td>${cliente.username}</td>
                <td>${cliente.nombre}</td>
                <td class="td-acciones">
                    <button class="btn-accion btn-historial"
                            onclick="verHistorial(${cliente.id_cliente}, '${cliente.nombre}')">Historial</button>
                    <button class="btn-accion btn-historial"
                            onclick="eliminarCliente(${cliente.id_cliente})">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

function renderizarAdministradores(admins) {
    const tbody = document.querySelector('#tablaAdministradores tbody');
    tbody.innerHTML = '';

    if (!admins || admins.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay administradores registrados.</td></tr>`;
        return;
    }

    admins.forEach(admin => {
        tbody.innerHTML += `
            <tr>
                <td>${admin.id_administrador}</td>
                <td>${admin.username}</td>
                <td>${admin.nombre}</td>
                <td class="td-acciones">
                    <button class="btn-accion btn-historial"
                            onclick="eliminarAdmin(${admin.id_administrador}, '${admin.username}')">
                        Eliminar
                    </button>
                </td>
            </tr>
        `;
    });
}

function cargarTiposEstres() {
    fetch('/api/tipos-estres/', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector('#tablaTiposEstres tbody');
            tbody.innerHTML = '';

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay tipos de estrés registrados.</td></tr>`;
                return;
            }

            data.forEach(estres => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${estres.id_nivel_estres}</td>
                    <td>${estres.nivel_estres}</td>
                    <td>${estres.tipo_estres}</td>
                    <td class="td-acciones">
                        <button type="button" class="btn-accion btn-editar">Actualizar</button>
                        <button type="button" class="btn-accion btn-historial">Eliminar</button>
                    </td>
                `;
                tr.querySelector('.btn-editar').addEventListener('click', () =>
                    abrirEditarEstres(estres.id_nivel_estres, estres.nivel_estres, estres.tipo_estres)
                );
                tr.querySelector('.btn-historial').addEventListener('click', () =>
                    eliminarTipoEstres(estres.id_nivel_estres)
                );
                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("Error cargando catálogo de estrés:", err));
}


function abrirEditarEstres(id, nivel, tipo) {
    document.getElementById('editIdEstres').value = id;
    document.getElementById('editNivel').value    = nivel;
    document.getElementById('editTipo').value     = tipo;
    document.getElementById('modalEditarEstres').showModal();
}

async function guardarEdicionEstres(e) {
    e.preventDefault();
    const id = document.getElementById('editIdEstres').value;
    const datos = {
        nivel_estres: document.getElementById('editNivel').value.trim(),
        tipo_estres:  document.getElementById('editTipo').value.trim()
    };

    if (!datos.nivel_estres || !datos.tipo_estres) {
        toastError('Completa nivel y tipo.');
        return;
    }

    try {
        const res = await fetch(`/api/tipos-estres/actualizar/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify(datos),
        });
        const body = await res.json();

        if (res.ok) {
            document.getElementById('modalEditarEstres').close();
            cargarTiposEstres();
            toastExito(body.mensaje || 'Actualizado correctamente.');
        } else {
            toastError(body.error || 'No se pudo actualizar.');
        }
    } catch (err) {
        console.error(err);
        toastError('Error de conexión con el servidor.');
    }
}

async function eliminarTipoEstres(idEstres) {
    const ok = await confirmarBorrado(
        '¿Eliminar tipo de estrés?',
        'Se borrará el tipo y los diagnósticos asociados. Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    try {
        const res = await fetch(`/api/tipos-estres/eliminar/${idEstres}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        });
        const body = await res.json();

        if (res.ok) {
            cargarTiposEstres();
            toastExito(body.mensaje || 'Tipo de estrés eliminado.');
        } else {
            toastError(body.error || 'No se pudo eliminar.');
        }
    } catch (e) {
        console.error(e);
        toastError('Error de conexión con el servidor.');
    }
}



document.getElementById('formTipoEstres').addEventListener('submit', function (e) {
    e.preventDefault();

    const nivel = document.getElementById('inputNivel').value.trim();
    const tipo  = document.getElementById('inputTipo').value.trim();

    if (!nivel || !tipo) {
        toastError('Completa nivel y tipo antes de guardar.');
        return;
    }

    fetch('/api/tipos-estres/crear/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({ nivel_estres: nivel, tipo_estres: tipo })
    })
    .then(res => {
        if (res.ok) {
            toastExito('¡Tipo de estrés guardado!');
            document.getElementById('formTipoEstres').reset();
            cargarTiposEstres();
        } else {
            return res.json().then(err => { throw new Error(err.error || 'Error al guardar'); });
        }
    })
    .catch(err => toastError('Error: ' + err.message));
});

document.getElementById('formNuevoUsuario').addEventListener('submit', function (e) {
    e.preventDefault();
    const rol = document.getElementById('tipoRol').value;
    const usernameInput = document.getElementById('nuevoUsername').value.trim();
    const nombre = document.getElementById('nuevoNombre').value.trim();
    const password = document.getElementById('nuevoPassword').value;

    if (!usernameInput || !nombre || !password) {
        toastError('Completa todos los campos.');
        return;
    }

    const endpoint = rol === 'administrador'
        ? '/auth/administrador/crear/'
        : '/auth/clientes/crear/';

    const datos = {
        username: usernameInput,
        nombre: nombre,
        email: usernameInput + "@sistema.com",
        password: password
    };

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(datos)
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(res => {
        if (res.status === 201 || res.status === 200) {
            if (rol === 'administrador') {
                let adminsLocales = obtenerAdminsLocales();
                adminsLocales.push(usernameInput.toLowerCase());
                localStorage.setItem('lista_admins', JSON.stringify(adminsLocales));
            }
            document.getElementById('formNuevoUsuario').reset();
            cargarDatosCompletos();
            toastExito(`¡${rol.toUpperCase()} creado con éxito!`);
        } else {
            let mensajeError = "Error desconocido";
            if (res.body.error)         mensajeError = res.body.error;
            else if (res.body.username) mensajeError = "El nombre de usuario ya existe.";
            else if (res.body.password) mensajeError = "La contraseña es muy corta (mínimo 8).";
            else                        mensajeError = JSON.stringify(res.body);
            toastError(mensajeError);
        }
    })
    .catch(() => toastError('Error de conexión con el servidor.'));
});



async function eliminarCliente(idCliente) {
    const ok = await confirmarBorrado(
        '¿Eliminar paciente?',
        'Se borrará al paciente y su cuenta de acceso. Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    try {
        const res = await fetch(`/auth/clientes/${idCliente}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        });
        const body = await res.json();

        if (res.ok) {
            cargarDatosCompletos();
            toastExito(body.mensaje || 'Paciente eliminado correctamente.');
        } else {
            toastError(body.error || 'No se pudo eliminar al paciente.');
        }
    } catch (e) {
        console.error(e);
        toastError('Error de conexión con el servidor.');
    }
}


async function eliminarAdmin(idAdmin, username) {
    // Admin local (solo en localStorage)
    if (idAdmin === null || idAdmin === undefined) {
        const ok = await confirmarBorrado(
            `¿Ocultar a ${username}?`,
            'Este administrador solo existe en este navegador.',
            'Sí, ocultar'
        );
        if (!ok) return;

        const adminsLocales = obtenerAdminsLocales()
            .filter(u => u !== username.toLowerCase());
        localStorage.setItem('lista_admins', JSON.stringify(adminsLocales));
        cargarDatosCompletos();
        return;
    }

    const ok = await confirmarBorrado(
        `¿Eliminar a ${username}?`,
        'Se borrará al administrador y su cuenta de acceso. Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    try {
        const res = await fetch(`/auth/administradores/${idAdmin}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
        });
        const body = await res.json();

        if (res.ok) {
            cargarDatosCompletos();
            toastExito(body.mensaje || 'Administrador eliminado correctamente.');
        } else {
            toastError(body.error || 'No se pudo eliminar al administrador.');
        }
    } catch (e) {
        console.error(e);
        toastError('Error de conexión con el servidor.');
    }
}


function verHistorial(idCliente, nombreCliente) {
    document.getElementById('tituloHistorial').textContent = `Historial de: ${nombreCliente}`;
    document.getElementById('seccionHistorial').style.display = 'block';

    const tbody = document.querySelector('#tablaHistorial tbody');
    tbody.innerHTML = '';

    const hoy = new Date();
    const fechaFormateada = hoy.toLocaleDateString() + " " + hoy.toLocaleTimeString();

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
    window.location.href = '/login/';
}

function cambiarVista(idVista, evento) {
    if (evento) evento.preventDefault();

    const secciones = document.querySelectorAll('.vista-seccion');
    secciones.forEach(sec => sec.style.display = 'none');

    const seccionActiva = document.getElementById(`vista-${idVista}`);
    if (seccionActiva) seccionActiva.style.display = 'block';

    const links = document.querySelectorAll('.sidebar-nav .nav-item');
    links.forEach(link => link.classList.remove('activo'));

    if (evento && evento.currentTarget) {
        evento.currentTarget.classList.add('activo');
    }
}