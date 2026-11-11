document.addEventListener('DOMContentLoaded', async () => {
    const txtNivel = document.getElementById('txtNivelEstres');
    const txtTipo = document.getElementById('txtTipoEstres');
    const valBPM = document.getElementById('valBPM'); // El nuevo campo de BPM
    const valHRV = document.getElementById('valHRV'); // El nuevo campo de HRV/RMSSD
    const cajaMensaje = document.getElementById('msjResultado');

    // 1. Recuperamos el ID de la evaluación y el BPM real de la banda
    const evaluacionId = localStorage.getItem('id_evaluacion');
    const bpmReal = localStorage.getItem('resultado_bpm') || '75';
    const rmssdReal = localStorage.getItem('resultado_rmssd') || '45.0';

    // Mostramos el BPM real de inmediato en la tarjeta
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

    // Bandera anti-bucle
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
        cajaMensaje.style.color = "black";
        cajaMensaje.textContent = "Guardando latidos y ejecutando el modelo Random Forest...";
    }

    try {
        // PASO 1: Enviar el BPM real que capturó el navegador a Django
        const responseGuardar = await fetch(`http://127.0.0.1:8000/evaluaciones/medicion/navegador/${evaluacionId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bpm: parseFloat(bpmReal), rmssd: parseFloat(rmssdReal) })
        });

        if (!responseGuardar.ok) throw new Error("No se pudo guardar la medición.");

        // PASO 2: Pedirle a Python que ejecute el Random Forest
        const responsePredecir = await fetch(`http://127.0.0.1:8000/evaluaciones/predecir/${evaluacionId}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await responsePredecir.json();
        if (!responsePredecir.ok) throw new Error(data.error || "Error en el modelo.");

        // PASO 3: Pintar el resultado
        const nivel = data.nivel_estres_categoria; // "Bajo", "Medio" o "Alto"
        const tipo = data.tipo_de_estres; 

        let color = "#10b981"; // Verde
        if (nivel === "Alto") color = "#ef4444"; // Rojo
        if (nivel === "Medio") color = "#f59e0b"; // Naranja

        if (txtNivel) {
            txtNivel.textContent = nivel;
            txtNivel.style.color = color;
        }
        if (txtTipo) txtTipo.textContent = "Tipo: " + tipo;
        if (cajaMensaje) {
            cajaMensaje.style.color = "#10b981";
            cajaMensaje.textContent = `Análisis completado con éxito. (${bpmReal} BPM analizados)`;
        }

        // Guardamos en caché para la bandera anti-bucle
        localStorage.setItem('procesado_' + evaluacionId, 'true');
        localStorage.setItem('nivel_guardado_' + evaluacionId, nivel);
        localStorage.setItem('tipo_guardado_' + evaluacionId, tipo);
        localStorage.setItem('color_guardado_' + evaluacionId, color);

    } catch (error) {
        console.error("Error:", error);
        if (cajaMensaje) {
            cajaMensaje.style.display = 'block';
            cajaMensaje.style.color = "red";
            cajaMensaje.textContent = "Error: " + error.message;
        }
    }
});

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'login.html';
}