from rest_framework.decorators import api_view
from rest_framework.response import Response
from .service import obtener_todos_los_tipos_estres

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