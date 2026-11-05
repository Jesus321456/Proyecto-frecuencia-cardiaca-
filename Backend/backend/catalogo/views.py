from rest_framework.decorators import api_view
from rest_framework.response import Response
from .service import obtener_todos_los_tipos_estres,crear_nuevo_tipo_estres, obtener_tipo_estres_por_id, actualizar_tipo_estres

#Las rutas de este controlador empiezan con /catalogo/ y se encargan de manejar los tipos de estrés.
@api_view(['GET'])
def lista_tipos_estres_api(request):
    tipos = obtener_todos_los_tipos_estres()
    datos = []
    for t in tipos:
        datos.append({
            "id_nivel_estres": t.id_nivel_estres,
            "nivel_estres": t.nivel_estres,
            "tipo_estres": t.tipo_estres
        })
    return Response(datos, status=200)


@api_view(['GET'])
def obtiene_tipo_estres_por_id_api(request, id):
    dato_id = []
    dato = obtener_tipo_estres_por_id(id)

    if dato is None:
        return Response({"error": "No se encontró un tipo de estrés con ese ID"}, status=500)

    dato_id.append({
        "id_nivel_estres": dato.id_nivel_estres,
        "nivel_estres": dato.nivel_estres,
        "tipo_estres": dato.tipo_estres
    })

    return Response(dato_id, status=200)


@api_view(['POST'])
def crear_tipo_estres_api(request):
    nivel = request.data.get('nivel_estres')
    tipo = request.data.get('tipo_estres')
    
    if not nivel or not tipo:
        return Response({"error": "Faltan datos"}, status=400)
        
    nuevo = crear_nuevo_tipo_estres(nivel, tipo)
    return Response({
        "mensaje": "Tipo de estrés creado",
        "id": nuevo.id_nivel_estres
    }, status=200)


@api_view(['PUT'])
def actualizar_tipo_estres_api(request, pk):
    nivel = request.data.get('nivel_estres')
    tipo = request.data.get('tipo_estres')
    
    if not nivel or not tipo:
        return Response({"error": "Debes enviar nivel_estres y tipo_estres"}, status=400)
        
    actualizado = actualizar_tipo_estres(pk, nivel, tipo)
    
    if actualizado:
        return Response({
            "mensaje": "Actualizado correctamente",
            "id": actualizado.id_nivel_estres,
            "nivel_estres": actualizado.nivel_estres,
            "tipo_estres": actualizado.tipo_estres
        }, status=200)
    
    return Response({"error": "No se encontró el registro con ese ID"}, status=404)