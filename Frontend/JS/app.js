// 1. Seleccionamos todas las pantallas y elementos interactivos
const pantallas = document.querySelectorAll('.pantalla');
const btnIniciar = document.getElementById('btn-iniciar');
const formCuestionario = document.getElementById('form-cuestionario');
const btnReintentar = document.getElementById('btn-reintentar');
const btnVerDiagnostico = document.getElementById('btn-ver-diagnostico');
const btnReiniciar = document.getElementById('btn-reiniciar');

// Función para cambiar de pantalla
function mostrarPantalla(idPantalla) {
    // Ocultar todas
    pantallas.forEach(pantalla => {
        pantalla.classList.remove('activa');
    });
    // Mostrar la solicitada
    document.getElementById(idPantalla).classList.add('activa');
}

// --- FLUJO DEL DIAGRAMA ---

// 1. Pantalla de Inicio -> Cuestionario
btnIniciar.addEventListener('click', () => {
    mostrarPantalla('pantalla-cuestionario');
});

// 2. Cuestionario -> Enviar -> Cargando (Detectando Frecuencia)
formCuestionario.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    // Aquí podrías recolectar los datos del formulario (edad, etc.)
    
    mostrarPantalla('pantalla-cargando');

    // SIMULACIÓN: Vamos a simular que el sistema tarda 3 segundos en buscar los datos.
    // Para probar el flujo de ERROR, cambia el 'true' a 'false' o pon una condición aleatoria.
    setTimeout(() => {
        const exito = true; // Simulamos que los datos SÍ se encontraron

        if (exito) {
            // Va a la pantalla de "Datos encontrados" (Check verde)
            mostrarPantalla('pantalla-exito');
            
            // Después de 2 segundos en la pantalla de éxito, pasa a la evaluación
            setTimeout(() => {
                mostrarPantalla('pantalla-evaluacion');
            }, 2000);

        } else {
            // Va a la pantalla de Error (X)
            mostrarPantalla('pantalla-error');
        }
    }, 3000); // 3000 milisegundos = 3 segundos
});

// 3. Pantalla de Error -> Botón Reintentar -> Vuelve al Cuestionario
btnReintentar.addEventListener('click', () => {
    mostrarPantalla('pantalla-cuestionario');
});

// 4. Pantalla de Evaluación -> Botón Ver Diagnóstico -> Diagnóstico Final
btnVerDiagnostico.addEventListener('click', () => {
    // Aquí es donde el Backend nos enviaría el diagnóstico real.
    // Por ahora, simulamos que el resultado es "Estrés Metabólico"
    
    document.getElementById('resultado-nivel').textContent = "ALTO"; // Podría ser BAJO, MEDIO
    document.getElementById('resultado-diagnostico').textContent = "Estrés Metabólico";
    
    mostrarPantalla('pantalla-diagnostico');
});

// 5. Diagnóstico Final -> Botón Finalizar -> Vuelve al inicio
btnReiniciar.addEventListener('click', () => {
    // Limpiar el formulario
    formCuestionario.reset();
    // Volver al inicio
    mostrarPantalla('pantalla-inicio');
});