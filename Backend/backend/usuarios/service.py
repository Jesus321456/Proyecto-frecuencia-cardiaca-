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
        
        nuevo_admin = Cliente.objects.create(
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
        return None, "Credenciales incorrectas"
    
    if hasattr(usuario, 'admin'):
        rol = "Administrador"
    elif hasattr(usuario, 'cliente'):
        rol = "Cliente"
    else:
        rol = "Sin rol asignado"

    return usuario, rol