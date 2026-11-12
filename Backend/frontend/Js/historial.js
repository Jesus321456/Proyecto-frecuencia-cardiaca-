document.addEventListener('DOMContentLoaded', async () => {
    const cuerpoTabla = document.getElementById('cuerpoTablaHistorial');
    const cajaMensaje = document.getElementById('msjHistorial');
    
    // 1. Obtenemos el ID del paciente que el Admin seleccionó
    const usuarioId = localStorage.getItem('id_paciente_seleccionado');
    const nombrePaciente = localStorage.getItem('nombre_paciente_seleccionado');

    if (!usuarioId) {
        if (cajaMensaje) {
            cajaMensaje.style.color = "red";
            cajaMensaje.textContent = "Error: No se seleccionó un paciente.";
        }
        return;
    }

    // Cambiamos el título para que muestre el nombre del paciente
    if (nombrePaciente) {
        const titulo = document.querySelector('.form-header-title h2');
        if (titulo) titulo.textContent = `Historial de: ${nombrePaciente}`;
    }

    if (cajaMensaje) {
        cajaMensaje.style.color = "black";
        cajaMensaje.textContent = "Cargando historial desde el servidor...";
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/evaluaciones/historial/${usuarioId}/`);
        
        if (!response.ok) {
            throw new Error("No se pudo obtener el historial.");
        }

        const historial = await response.json();
        if (cuerpoTabla) cuerpoTabla.innerHTML = '';

        if (historial.length === 0) {
            if (cuerpoTabla) {
                cuerpoTabla.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666; padding: 20px;">Este paciente no tiene evaluaciones registradas.</td></tr>`;
            }
            if (cajaMensaje) cajaMensaje.textContent = "";
            return;
        }

        historial.forEach(item => {
            let claseNivel = "bajo";
            if (item.nivel === "Medio") claseNivel = "medio";
            if (item.nivel === "Alto") claseNivel = "alto";

            const fila = document.createElement('tr');
            fila.style.borderBottom = "1px solid #e2e8f0";
            
            fila.innerHTML = `
                <td style="padding: 12px;">${item.fecha}</td>
                <td style="padding: 12px;">${item.bpm !== 'N/A' ? item.bpm + ' BPM' : 'N/A'}</td>
                <td style="padding: 12px;">${item.rmssd !== 'N/A' ? item.rmssd + ' ms' : 'N/A'}</td>
                <td style="padding: 12px;"><span class="badge-estres ${claseNivel}">${item.nivel}</span></td>
            `;
            
            if (cuerpoTabla) cuerpoTabla.appendChild(fila);
        });

        if (cajaMensaje) {
            cajaMensaje.style.color = "green";
            cajaMensaje.textContent = `Historial cargado correctamente (${historial.length} evaluaciones).`;
        }

    } catch (error) {
        console.error("Error:", error);
        if (cajaMensaje) {
            cajaMensaje.style.color = "red";
            cajaMensaje.textContent = "Error al cargar el historial: " + error.message;
        }
    }
});

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'login.html';
}