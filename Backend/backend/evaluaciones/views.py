from rest_framework.decorators import api_view
from rest_framework.response import Response
from usuarios.models import Cliente
from .models import Evaluacion, MedicionFisiologica
from django.utils import timezone
from .service import actualizar_informacion_cliente, crear_evaluacion, medir_y_guardar_frecuencia, predecir_y_actualizar_evaluacion

# Las rutas de este controlador empiezan con /evaluaciones/ y se encargan de manejar las evaluaciones de los clientes.
@api_view(['POST'])
def crear_evaluacion_api(request, usuario_id):
    datos_formulario = request.data
    
    nueva_eval = crear_evaluacion(usuario_id, datos_formulario)
    
    if nueva_eval:
        return Response({
            "mensaje": "Evaluación creada con éxito",
            "id_evaluacion": nueva_eval.id, 
            "hora_sueno": nueva_eval.hora_sueno,
            "calidad_sueno": nueva_eval.calidad_sueno

        }, status=201)
    else:
        return Response({"error": "No se pudo crear la evaluación"}, status=400)

@api_view(['POST'])
def predecir_estres_api(request, evaluacion_id):
    prediccion, nivel_texto, tipo_estres_texto, error = predecir_y_actualizar_evaluacion(evaluacion_id)

    
    if error:
        return Response({"error": error}, status=400)
        
    return Response({
        "mensaje": "Predicción realizada y diagnóstico guardado",
        "nivel_estres_numerico": prediccion,     
        "nivel_estres_categoria": nivel_texto,
        "tipo_de_estres": tipo_estres_texto    
    }, status=200)

@api_view(['POST'])
def iniciar_medicion_banda_api(request, evaluacion_id):
    duracion = request.data.get('duracion', 60)
    
    print(f"Iniciando medición bluetooth para evaluación {evaluacion_id}...")
    
    medicion, error = medir_y_guardar_frecuencia(evaluacion_id, int(duracion))
    
    if error:
        return Response({"error": error}, status=500)
        
    return Response({
        "mensaje": "Medición completada y guardada",
        "id_medicion": medicion.id,
        "frecuencia_promedio": medicion.frecuencia_cardiaca,
        "rmssd": medicion.rmssd, 
        "duracion_segundos": duracion
    }, status=201)

@api_view(['GET', 'PUT'])
def actualizar_informacion_cliente_api(request, pk):
    try:
        cliente = Cliente.objects.get(usuario_id=pk)
    except Cliente.DoesNotExist:
        return Response({"error": "Cliente no encontrado"}, status=404)

    if request.method == 'GET':
        return Response({
            "edad": cliente.edad,
            "genero": cliente.genero,
            "ocupacion": cliente.ocupacion,
            "peso": cliente.peso,
            "estatura": cliente.estatura
        }, status=200)

    elif request.method == 'PUT':
        datos_actualizados = request.data
        
        cliente_actualizado = actualizar_informacion_cliente(pk, datos_actualizados)

        if cliente_actualizado:
            return Response({
                "mensaje": "Información del cliente actualizada correctamente",
                "id": cliente_actualizado.usuario_id,
                "genero": cliente_actualizado.genero,
                "edad": cliente_actualizado.edad,
                "ocupacion": cliente_actualizado.ocupacion,
                "peso": cliente_actualizado.peso,
                "estatura": cliente_actualizado.estatura,
                "categoria_imc": cliente_actualizado.categoria_imc
            }, status=200)
        else:
            return Response({"error": "No se pudo actualizar el cliente"}, status=404)


@api_view(['POST'])
def guardar_medicion_navegador_api(request, evaluacion_id):
    try:
        evaluacion = Evaluacion.objects.get(id=evaluacion_id)
        bpm = request.data.get('bpm')
        
        if not bpm:
            return Response({"error": "No se recibió el BPM"}, status=400)

        medicion = MedicionFisiologica.objects.create(
            evaluacion=evaluacion,
            frecuencia_cardiaca=int(bpm),
            rmssd=float(request.data.get('rmssd', 45.0))
        )
        
        return Response({
            "mensaje": "Medición guardada desde el navegador",
            "id_medicion": medicion.id
        }, status=201)
    except Evaluacion.DoesNotExist:
        return Response({"error": "Evaluación no encontrada"}, status=404)


@api_view(['GET'])
def obtener_historial_api(request, usuario_id):
    try:
        evaluaciones = Evaluacion.objects.filter(usuario_id=usuario_id).order_by('-fecha_hora')
        
        historial = []
        for eval in evaluaciones:
            medicion = eval.mediciones.first()
            
            nivel_texto = "Desconocido"
            if eval.nivel_estres_reportado is not None:
                if eval.nivel_estres_reportado <= 3:
                    nivel_texto = "Bajo"
                elif eval.nivel_estres_reportado <= 7:
                    nivel_texto = "Medio"
                else:
                    nivel_texto = "Alto"

            fecha_local = timezone.localtime(eval.fecha_hora)
            fecha_formateada = fecha_local.strftime('%d/%m/%Y - %H:%M')

            historial.append({
                "fecha": fecha_formateada,
                "bpm": medicion.frecuencia_cardiaca if medicion else "N/A",
                "rmssd": medicion.rmssd if medicion else "N/A",
                "nivel": nivel_texto
            })
            
        return Response(historial, status=200)
    except Exception as e:
        print(f"ERROR EN HISTORIAL: {str(e)}")
        return Response({"error": str(e)}, status=500)
