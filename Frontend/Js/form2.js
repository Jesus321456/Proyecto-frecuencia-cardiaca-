document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formEstiloVida');
    const cajaMensaje = document.getElementById('msjSensor'); 

    if (!formulario) {
        console.error("No se encontró el formulario.");
        return;
    }

    formulario.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        
        alert("Paso 1: Botón presionado y evento iniciado.");

        const usuarioId = localStorage.getItem('id_usuario');
        alert("Paso 2: Tu ID de usuario es: " + usuarioId);

        if (!usuarioId) {
            alert("No hay sesión. Regresando al login...");
            window.location.href = 'login.html';
            return;
        }

        try {
            const datosEstiloVida = {
                // Verificamos que pueda leer todos los campos sin explotar
                hora_sueno: parseFloat(document.getElementById('horas_sueno').value) || 0, 
                calidad_sueno: parseInt(document.getElementById('calidad_sueno').value) || 0,
                nivel_actividad: parseInt(document.getElementById('nivel_actividad').value) || 0,
                presion_arterial: document.getElementById('presion_arterial').value.trim(),
                pasos_diarios: parseInt(document.getElementById('pasos_diarios').value) || 0,
                trastorno_sueno: document.getElementById('trastorno_sueno').value
            };
            
            alert("Paso 3: Datos leídos correctamente del HTML.");
            alert("Paso 4: Enviando datos a Django...");

            const response = await fetch(`http://127.0.0.1:8000/evaluaciones/crear/${usuarioId}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosEstiloVida)
            });
            
            alert("Paso 5: Django ya respondió. Status HTTP: " + response.status);

            if (!response.ok) {
                const textoError = await response.text();
                alert("❌ Django rechazó los datos: " + textoError);
                return;
            }

            const data = await response.json();
            alert("Paso 6: Éxito de Django. Recibimos esto: " + JSON.stringify(data));

            if (data.id_evaluacion) {
                localStorage.setItem('id_evaluacion', data.id_evaluacion);
                alert("Paso 7: ¡ID guardado! Redirigiendo al sensor en 1 segundo...");
                setTimeout(() => {
                    window.location.href = 'sensor.html';
                }, 1000);
            } else {
                alert("❌ Django respondió bien, pero olvidó enviar el 'id_evaluacion'.");
            }

        } catch (error) {
            alert("🛑 El código explotó aquí: " + error.message);
            console.error(error);
        }
    });
});

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'login.html';
}