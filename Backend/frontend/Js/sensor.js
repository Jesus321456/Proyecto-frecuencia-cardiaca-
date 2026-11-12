let dispositivoBluetooth = null;
let bpmActual = 0; 

document.addEventListener('DOMContentLoaded', () => {
    const evaluacionId = localStorage.getItem('id_evaluacion');
    const cajaMensaje = document.getElementById('msjSensor');

    if (!evaluacionId && cajaMensaje) {
        cajaMensaje.style.color = "red";
        cajaMensaje.textContent = "⚠️ Advertencia: No se encontró una evaluación activa. Vuelve a llenar tus datos.";
    }
});

// ==========================================
// FUNCIÓN 1: CONECTAR A LA BANDA REAL
// ==========================================
async function iniciarMedicionReal() {
    const cajaMensaje = document.getElementById('msjSensor');
    const seccionConexion = document.getElementById('seccionConexion');
    const seccionMidiendo = document.getElementById('seccionMidiendo');

    if (!navigator.bluetooth) {
        alert("Tu navegador no soporta Bluetooth. Usa Chrome o Edge en Android/PC.");
        return;
    }

    if (cajaMensaje) {
        cajaMensaje.style.display = 'block';
        cajaMensaje.style.color = "black";
        cajaMensaje.textContent = "Buscando banda GEOID HS500... (Asegúrate de tenerla puesta)";
    }

    try {
        dispositivoBluetooth = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }]
        });

        const server = await dispositivoBluetooth.gatt.connect();
        const service = await server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');

        if (seccionConexion) seccionConexion.style.display = 'none';
        if (seccionMidiendo) seccionMidiendo.style.display = 'block';

        if (cajaMensaje) {
            cajaMensaje.style.color = "green";
            cajaMensaje.textContent = "¡Conectado a la banda! Midiendo en tiempo real...";
        }

        characteristic.addEventListener('characteristicvaluechanged', manejarLatidos);
        await characteristic.startNotifications();

        let segundosRestantes = 10;
        const contador = document.getElementById('contadorSegundos');
        
        const intervaloVisual = setInterval(() => {
            segundosRestantes--;
            if (contador) contador.textContent = segundosRestantes + "s";
            
            if (segundosRestantes <= 0) {
                clearInterval(intervaloVisual);
                finalizarMedicion();
            }
        }, 1000);

    } catch (error) {
        console.error("Error Bluetooth:", error);
        if (cajaMensaje) {
            cajaMensaje.style.color = "red";
            cajaMensaje.textContent = "Error de conexión: " + error.message;
        }
        alert("No se pudo conectar. Revisa que la banda esté encendida y cerca.");
    }
}

// Función que recibe los latidos y los pinta en pantalla
function manejarLatidos(event) {
    const value = event.target.value;
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    let bpm = 0;

    if (rate16Bits) {
        bpm = value.getUint16(1, true);
    } else {
        bpm = value.getUint8(1);
    }

    if (bpm > 0) {
        bpmActual = bpm; 
        const txtBpmReal = document.getElementById('txtBpmReal');
        if (txtBpmReal) {
            txtBpmReal.textContent = bpmActual;
        }
        console.log("Latido real HS500:", bpmActual);
    }
}

// ==========================================
// FUNCIÓN 2: SIMULAR (MODO PRUEBA)
// ==========================================
function simularMedicion() {
    const cajaMensaje = document.getElementById('msjSensor');
    const seccionConexion = document.getElementById('seccionConexion');
    const seccionMidiendo = document.getElementById('seccionMidiendo');
    const txtBpmReal = document.getElementById('txtBpmReal');

    if (seccionConexion) seccionConexion.style.display = 'none';
    if (seccionMidiendo) seccionMidiendo.style.display = 'block';

    if (cajaMensaje) {
        cajaMensaje.style.color = "black";
        cajaMensaje.textContent = "Simulando lectura del sensor...";
    }

    bpmActual = 78;
    if (txtBpmReal) txtBpmReal.textContent = bpmActual;
    
    let segundos = 5;
    const contador = document.getElementById('contadorSegundos');

    const intervalo = setInterval(() => {
        segundos--;
        if (contador) contador.textContent = segundos + "s";
        
        if (segundos <= 0) {
            clearInterval(intervalo);
            finalizarMedicion();
        }
    }, 1000);
}

// ==========================================
// FUNCIÓN 3: GUARDAR Y REDIRIGIR
// ==========================================
function finalizarMedicion() {
    if (bpmActual === 0) {
        bpmActual = 75; 
    }

    // 1. Guardamos el BPM nuevo
    localStorage.setItem('resultado_bpm', bpmActual.toString());
    
    // 2. ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA! Limpiamos la bandera de la evaluación anterior
    const evaluacionId = localStorage.getItem('id_evaluacion');
    if (evaluacionId) {
        localStorage.removeItem('procesado_' + evaluacionId);
        localStorage.removeItem('nivel_guardado_' + evaluacionId);
        localStorage.removeItem('tipo_guardado_' + evaluacionId);
    }

    let rmssdSimulado = 50.0 - (bpmActual - 70); 
    if (rmssdSimulado < 10) rmssdSimulado = 15.5;
    localStorage.setItem('resultado_rmssd', rmssdSimulado.toFixed(1));

    actualizarHistorialLocal(bpmActual + ' BPM', 'Medido');

    if (dispositivoBluetooth && dispositivoBluetooth.gatt.connected) {
        dispositivoBluetooth.gatt.disconnect();
    }

    window.location.href = 'resultado.html';
}

function actualizarHistorialLocal(bpmTexto, nivelTexto) {
    let historial = JSON.parse(localStorage.getItem('historial_local') || '[]');
    if (historial.length > 0) {
        historial[0].bpm = bpmTexto;
        historial[0].nivel = nivelTexto;
        localStorage.setItem('historial_local', JSON.stringify(historial));
    }
}

function cerrarSesion() {
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('id_evaluacion');
    window.location.href = 'login.html';
}