from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from .models import Administrador, Cliente

Usuario = get_user_model()


def crear_administrador(username, email, password, nombre):
    with transaction.atomic():
        
        nuevo_usuario = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        nuevo_admin = Administrador.objects.create(
            usuario=nuevo_usuario,
            nombre=nombre
        )
        
        return nuevo_admin

def crear_cliente(username, email, password, nombre):
    with transaction.atomic():
        
        nuevo_usuario = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        nuevo_cliente = Cliente.objects.create(
            usuario=nuevo_usuario,
            nombre=nombre
        )
        
        return nuevo_cliente

def obtener_todos_los_clientes():
    return Cliente.objects.all()

def obtener_todos_los_administradores():
    return Administrador.objects.all()


def login_usuario(username, password):
    usuario = authenticate(username=username, password=password)
    
    if usuario is None:
        return None, "Credenciales incorrectas", None
    
    nombre = usuario.username

    if hasattr(usuario, 'admin'):
        rol = "Administrador"
        nombre= usuario.admin.nombre
    elif hasattr(usuario, 'administrador'): 
        rol = "Administrador"
        nombre = usuario.administrador.nombre
    elif hasattr(usuario, 'cliente'):
        rol = "Cliente"
        nombre = usuario.cliente.nombre
    else:
        rol = "Sin rol asignado"

    return usuario, rol, nombre


def eliminar_cliente(cliente_id):
    try:
        cliente = Cliente.objects.select_related('usuario').get(usuario_id=cliente_id)
    except Cliente.DoesNotExist:
        return False, "Cliente no encontrado."

    with transaction.atomic():
        usuario = cliente.usuario
        cliente.delete()
        usuario.delete()   

    return True, "Cliente eliminado correctamente."


def eliminar_administrador(admin_id, usuario_solicitante=None):
    
    try:
        admin = Administrador.objects.select_related('usuario').get(usuario_id=admin_id)
    except Administrador.DoesNotExist:
        return False, "Administrador no encontrado."

    if usuario_solicitante and admin.usuario_id == usuario_solicitante.id:
        return False, "No puedes eliminar tu propia cuenta de administrador."

    with transaction.atomic():
        admin.usuario.delete() 

    return True, "Administrador eliminado correctamente."