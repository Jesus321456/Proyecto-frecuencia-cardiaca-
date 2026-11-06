from rest_framework.decorators import api_view
from rest_framework.response import Response
from .service import login_usuario, crear_administrador, crear_cliente, obtener_todos_los_clientes, obtener_todos_los_administradores

#Las rutas de este controlador empiezan con /auth/ y se encargan de manejar la autenticación y gestión de usuarios.
@api_view(['GET'])
def lista_clientes_api(request):
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
def lista_adminstradores_api(request):
    administradores = obtener_todos_los_administradores()
    datos = []
    for administrador in administradores:
        datos.append({
            "id_administrador": administrador.usuario.id,
            "username": administrador.usuario.username,
            "nombre": administrador.nombre,
        })

    return Response(datos, status=200)


@api_view(['POST'])
def registro_admin_api(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    nombre = request.data.get('nombre')
    
    if not all([username, email, password, nombre]):
        return Response({"error": "Faltan datos obligatorios"}, status=400)
        
    try:
        nuevo_admin = crear_administrador(username, email, password, nombre)
        return Response({
            "mensaje": "Administrador creado con éxito",
            "id": nuevo_admin.id,
            "username": nuevo_admin.usuario.username
        }, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
def registro_cliente_api(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    nombre = request.data.get('nombre')
    
    if not all([username, email, password, nombre]):
        return Response({"error": "Faltan datos obligatorios"}, status=400)
        
    try:
        nuevo_cliente = crear_cliente(username, email, password, nombre)
        return Response({
            "mensaje": "Cliente creado con éxito",
            "id": nuevo_cliente.id,
            "username": nuevo_cliente.usuario.username
        }, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['POST'])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({"error": "Usuario y contraseña son obligatorios"}, status=400)
        
    # Llamamos al servicio
    usuario, rol = login_usuario(username, password)
    
    if usuario is not None:
        return Response({
            "mensaje": "Login exitoso",
            "id_usuario": usuario.id,
            "username": usuario.username,
            "rol": rol  
        }, status=200)
    else:
        return Response({"error": rol}, status=401)
