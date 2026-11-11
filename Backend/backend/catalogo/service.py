from .models import TipoEstres 
from django.db import transaction
from django.db.models.deletion import ProtectedError
from evaluaciones.models import Diagnostico   


def obtener_todos_los_tipos_estres():
    return TipoEstres.objects.all()


def crear_nuevo_tipo_estres(nivel, tipo):
    nuevo = TipoEstres.objects.create(nivel_estres=nivel, tipo_estres=tipo)
    return nuevo



def actualizar_tipo_estres(id_nivel, nuevo_nivel, nuevo_tipo):
    try:
        tipo = TipoEstres.objects.get(id_nivel_estres=id_nivel)
        
        tipo.nivel_estres = nuevo_nivel
        tipo.tipo_estres = nuevo_tipo        
        tipo.save() 

        return tipo
    except TipoEstres.DoesNotExist:
        return None
    
def obtener_tipo_estres_por_id(id_nivel):
    try:
        dato = TipoEstres.objects.get(id_nivel_estres=id_nivel)
        return dato

    except TipoEstres.DoesNotExist:
            return None
    




def eliminar_tipo_estres(id_estres):
    try:
        tipo = TipoEstres.objects.get(id_nivel_estres=id_estres)
    except TipoEstres.DoesNotExist:
        return False, "Tipo de estrés no encontrado."

    try:
        with transaction.atomic():
            Diagnostico.objects.filter(tipo_estres=tipo).delete()

            tipo.delete()

        return True, "Tipo de estrés eliminado correctamente."

    except ProtectedError:
        return False, "No se puede eliminar: hay diagnósticos que dependen de este tipo."
    except Exception as e:
        return False, f"Error al eliminar: {e}"