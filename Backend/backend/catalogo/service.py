from .models import TipoEstres 

def obtener_todos_los_tipos_estres():
    return TipoEstres.objects.all()


