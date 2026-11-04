class Usuario:

    def __init__(self, id_usuario, nombre, correo, contrasena):
        self.id_usuario = id_usuario
        self.nombre = nombre
        self.correo = correo
        self.contrasena = contrasena

    def __str__(self):
        return f"Usuario(id_usuario={self.id_usuario}, nombre={self.nombre}, correo={self.correo})"