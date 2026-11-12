let saliendoDePagina = false;

document.addEventListener('DOMContentLoaded', async () => {
    const txtNivel = document.getElementById('txtNivelEstres');
    const txtTipo = document.getElementById('txtTipoEstres');
    const valBPM = document.getElementById('valBPM'); 
    const valHRV = document.getElementById('valHRV'); 
    const cajaMensaje = document.getElementById('msjResultado');

    const evaluacionId = localStorage.getItem('id_evaluacion');
    const bpmReal = localStorage.getItem('resultado_bpm') || '75';
    const rmssdReal = localStorage.getItem('resultado_rmssd') || '45.0';

    if (valBPM) valBPM.textContent = bpmReal + ' BPM';
    if (valHRV) valHRV.textContent = rmssdReal + ' ms';

    if (!evaluacionId) {
        if (cajaMensaje) {
            cajaMensaje.style.display = 'block';
            cajaMensaje.style.color = "red";
            cajaMensaje.textContent = "Error: No se encontró la evaluación.";
        }
        return;
    }

    const yaProcesado = localStorage.getItem('procesado_' + evaluacionId);
    if (yaProcesado === 'true') {
        if (txtNivel) {
            txtNivel.textContent = localStorage.getItem('nivel_guardado_' + evaluacionId) || "Completado";
            txtNivel.style.color = localStorage.getItem('color_guardado_' + evaluacionId) || "#10b981";
        }
        if (txtTipo) txtTipo.textContent = localStorage.getItem('tipo_guardado_' + evaluacionId) || "";
        return; 
    }

    if (cajaMensaje) {
        cajaMensaje.style.display = 'block';
        cajaMensaje.style.color = "#38bdf8";
        cajaMensaje.textContent = "Guardando latidos y ejecutando el modelo Random Forest...";
    }

    try {
        const responseGuardar = await fetch(`/evaluaciones/medicion/navegador/${evaluacionId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bpm: parseFloat(bpmReal), rmssd: parseFloat(rmssdReal) })
        });

        if (!responseGuardar.ok) throw new Error("No se pudo guardar la medición.");

        const responsePredecir = await fetch(`/evaluaciones/predecir/${evaluacionId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await responsePredecir.json();
        if (!responsePredecir.ok) throw new Error(data.error || "Error en el modelo.");

        const nivel = data.nivel_estres_categoria; 
        const tipo = data.tipo_de_estres; 

        let color = "#10b981"; 
        if (nivel === "Alto") color = "#ef4444"; 
        if (nivel === "Medio") color = "#f59e0b"; 

        if (txtNivel) {
            txtNivel.textContent = nivel;
            txtNivel.style.color = color;
        }
        if (txtTipo) txtTipo.textContent = "Tipo: " + tipo;
        if (cajaMensaje) {
            cajaMensaje.style.color = "#10b981";
            cajaMensaje.textContent = `Análisis completado con éxito. (${bpmReal} BPM analizados)`;
        }

        localStorage.setItem('procesado_' + evaluacionId, 'true');
        localStorage.setItem('nivel_guardado_' + evaluacionId, nivel);
        localStorage.setItem('tipo_guardado_' + evaluacionId, tipo);
        localStorage.setItem('color_guardado_' + evaluacionId, color);

    } catch (error) {
        if (saliendoDePagina || error.name === 'AbortError') return;

        console.error("Error:", error);
        if (cajaMensaje) {
            cajaMensaje.style.display = 'block';
            cajaMensaje.style.color = "red";
            cajaMensaje.textContent = "Error: " + error.message;
        }
    }
});

function nuevaEvaluacion() {
    saliendoDePagina = true; 
    
    const evaluacionId = localStorage.getItem('id_evaluacion');
    if (evaluacionId) {
        localStorage.removeItem('procesado_' + evaluacionId);
        localStorage.removeItem('nivel_guardado_' + evaluacionId);
        localStorage.removeItem('tipo_guardado_' + evaluacionId);
    }
    localStorage.removeItem('id_evaluacion');
    localStorage.removeItem('resultado_bpm');
    localStorage.removeItem('resultado_rmssd');
    
    window.location.href = '/formulario_uno/'; 
}

function cerrarSesion() {
    saliendoDePagina = true; 
    localStorage.clear();
    window.location.href = '/login/'; 
}