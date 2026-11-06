from rest_framework.decorators import api_view
from rest_framework.response import Response
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

@api_view(['PUT'])
def actualizar_informacion_cliente_api(request, pk):
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
        return Response({"error": "No se encontró un cliente con ese ID"}, status=404)