from django.contrib.auth import login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .service import (
    login_usuario,
    crear_administrador,
    crear_cliente,
    obtener_todos_los_clientes,
    obtener_todos_los_administradores,
    eliminar_cliente,
    eliminar_administrador,
    UsuarioDuplicadoError,
)


def es_administrador(user):
    return user.is_authenticated and (
        hasattr(user, 'administrador') or hasattr(user, 'admin')
    )


def es_cliente(user):
    return user.is_authenticated and hasattr(user, 'cliente')



@api_view(['POST'])
@permission_classes([AllowAny])
def registro_admin_api(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    nombre = request.data.get('nombre')

    if not all([username, email, password, nombre]):
        return Response({"error": "Faltan datos obligatorios"}, status=400)

    try:
        nuevo_admin = crear_administrador(username, email, password, nombre)
    except UsuarioDuplicadoError as e:
        return Response({"error": e.mensaje, "campo": e.campo}, status=400)
    except Exception:
        return Response(
            {"error": "No se pudo crear el administrador. Intenta de nuevo."},
            status=500,
        )

    return Response({
        "mensaje": "Administrador creado con éxito",
        "id": nuevo_admin.id,
        "username": nuevo_admin.usuario.username,
    }, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def registro_cliente_api(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    nombre = request.data.get('nombre')

    if not all([username, email, password, nombre]):
        return Response({"error": "Faltan datos obligatorios"}, status=400)

    try:
        nuevo_cliente = crear_cliente(username, email, password, nombre)
    except UsuarioDuplicadoError as e:
        return Response({"error": e.mensaje, "campo": e.campo}, status=400)
    except Exception:
        return Response(
            {"error": "No se pudo crear el cliente. Intenta de nuevo."},
            status=500,
        )

    return Response({
        "mensaje": "Cliente creado con éxito",
        "id": nuevo_cliente.id,
        "username": nuevo_cliente.usuario.username,
    }, status=201)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {"error": "Usuario y contraseña son obligatorios"}, status=400
        )

    usuario, rol, nombre = login_usuario(username, password)

    if usuario is not None:
        login(request, usuario)
        return Response({
            "mensaje": "Login exitoso",
            "id_usuario": usuario.id,
            "username": usuario.username,
            "rol": rol,
            "nombre": nombre,
        }, status=200)

    return Response({"error": rol}, status=401)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    logout(request)
    return Response({"mensaje": "Sesión cerrada correctamente"}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_actual_api(request):
    user = request.user
    rol = "Sin rol asignado"
    nombre = user.username

    if hasattr(user, 'administrador'):
        rol = "Administrador"
        nombre = user.administrador.nombre
    elif hasattr(user, 'admin'):
        rol = "Administrador"
        nombre = user.admin.nombre
    elif hasattr(user, 'cliente'):
        rol = "Cliente"
        nombre = user.cliente.nombre

    return Response({
        "id": user.id,
        "username": user.username,
        "rol": rol,
        "nombre": nombre,
    }, status=200)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lista_clientes_api(request):
    if not es_administrador(request.user):
        return Response({"error": "No autorizado"}, status=403)

    clientes = obtener_todos_los_clientes()
    datos = []
    for cliente in clientes:
        datos.append({
            "id_cliente": cliente.usuario.id,
            "username": cliente.usuario.username,
            "nombre": cliente.nombre,
        })
    return Response(datos, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lista_adminstradores_api(request):
    if not es_administrador(request.user):
        return Response({"error": "No autorizado"}, status=403)

    administradores = obtener_todos_los_administradores()
    datos = []
    for administrador in administradores:
        datos.append({
            "id_administrador": administrador.usuario.id,
            "username": administrador.usuario.username,
            "nombre": administrador.nombre,
        })
    return Response(datos, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_cliente_api(request, cliente_id):
    if not es_administrador(request.user):
        return Response({"error": "No autorizado"}, status=403)

    ok, mensaje = eliminar_cliente(cliente_id)
    if ok:
        return Response({"mensaje": mensaje}, status=200)
    return Response({"error": mensaje}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def eliminar_administrador_api(request, admin_id):
    if not es_administrador(request.user):
        return Response({"error": "No autorizado"}, status=403)

    ok, mensaje = eliminar_administrador(
        admin_id, usuario_solicitante=request.user
    )
    if ok:
        return Response({"mensaje": mensaje}, status=200)
    return Response({"error": mensaje}, status=400)