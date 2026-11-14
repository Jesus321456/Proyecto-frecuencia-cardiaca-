from unittest.mock import patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from .models import Administrador, Cliente
from .service import (crear_administrador, crear_cliente, obtener_todos_los_clientes, obtener_todos_los_administradores,login_usuario,eliminar_cliente, eliminar_administrador)

Usuario = get_user_model()


class BaseUsuariosTest(TestCase):
    def setUp(self):
        self.admin = crear_administrador(
            username="admin1", email="admin1@test.com",
            password="pass1234", nombre="Admin Uno",
        )
        self.cliente = crear_cliente(
            username="cli1", email="cli1@test.com",
            password="pass1234", nombre="Cliente Uno",
        )


    def test_crea_usuario_y_perfil(self):
        admin = crear_administrador("juan", "j@test.com", "pwd12345", "Juan")

        self.assertIsNotNone(admin.pk)
        self.assertEqual(admin.nombre, "Juan")
        self.assertEqual(admin.usuario.username, "juan")
        self.assertEqual(admin.usuario.email, "j@test.com")

    def test_password_queda_hasheado(self):
        admin = crear_administrador("ana", "a@test.com", "pwd12345", "Ana")

        self.assertNotEqual(admin.usuario.password, "pwd12345")
        self.assertTrue(admin.usuario.check_password("pwd12345"))

    def test_rollback_si_falla_creacion_del_perfil(self):
        with patch.object(Administrador.objects, "create",
                          side_effect=IntegrityError("boom")):
            with self.assertRaises(IntegrityError):
                crear_administrador("pedro", "p@test.com", "pwd", "Pedro")

        self.assertFalse(Usuario.objects.filter(username="pedro").exists())

    def test_username_duplicado_lanza_error(self):
        crear_administrador("dup", "d1@test.com", "pwd", "Dup")

        with self.assertRaises(IntegrityError):
            crear_administrador("dup", "d2@test.com", "pwd", "Dup2")


class CrearClienteTest(TestCase):

    def test_crea_usuario_y_perfil(self):
        cli = crear_cliente("maria", "m@test.com", "pwd12345", "María")

        self.assertIsNotNone(cli.pk)
        self.assertEqual(cli.nombre, "María")
        self.assertEqual(cli.usuario.username, "maria")

    def test_password_hasheado(self):
        cli = crear_cliente("sofia", "s@test.com", "pwd12345", "Sofía")

        self.assertTrue(cli.usuario.check_password("pwd12345"))

    def test_rollback_si_falla_creacion_del_perfil(self):
        with patch.object(Cliente.objects, "create",
                          side_effect=IntegrityError("boom")):
            with self.assertRaises(IntegrityError):
                crear_cliente("luis", "l@test.com", "pwd", "Luis")

        self.assertFalse(Usuario.objects.filter(username="luis").exists())


class ObtenerTodosTest(BaseUsuariosTest):

    def test_clientes_devuelve_todos(self):
        crear_cliente("c2", "c2@test.com", "pwd", "C2")

        qs = obtener_todos_los_clientes()

        self.assertEqual(qs.count(), 2)
        self.assertIn(self.cliente, qs)

    def test_clientes_vacio(self):
        Cliente.objects.all().delete()
        self.assertEqual(obtener_todos_los_clientes().count(), 0)

    def test_administradores_devuelve_todos(self):
        crear_administrador("a2", "a2@test.com", "pwd", "A2")

        qs = obtener_todos_los_administradores()

        self.assertEqual(qs.count(), 2)
        self.assertIn(self.admin, qs)

    def test_administradores_vacio(self):
        Administrador.objects.all().delete()
        self.assertEqual(obtener_todos_los_administradores().count(), 0)


class LoginUsuarioTest(BaseUsuariosTest):

    def test_login_admin_correcto(self):
        usuario, rol, nombre = login_usuario("admin1", "pass1234")

        self.assertIsNotNone(usuario)
        self.assertEqual(rol, "Administrador")
        self.assertEqual(nombre, "Admin Uno")

    def test_login_cliente_correcto(self):
        usuario, rol, nombre = login_usuario("cli1", "pass1234")

        self.assertIsNotNone(usuario)
        self.assertEqual(rol, "Cliente")
        self.assertEqual(nombre, "Cliente Uno")

    def test_login_password_incorrecta(self):
        usuario, rol, nombre = login_usuario("admin1", "otra")

        self.assertIsNone(usuario)
        self.assertEqual(rol, "Credenciales incorrectas")
        self.assertIsNone(nombre)

    def test_login_usuario_inexistente(self):
        usuario, rol, nombre = login_usuario("nadie", "x")

        self.assertIsNone(usuario)
        self.assertEqual(rol, "Credenciales incorrectas")

    def test_login_usuario_inactivo(self):
        self.cliente.usuario.is_active = False
        self.cliente.usuario.save()

        usuario, rol, _ = login_usuario("cli1", "pass1234")

        self.assertIsNone(usuario)
        self.assertEqual(rol, "Credenciales incorrectas")

    def test_login_usuario_sin_perfil(self):
        """Un User sin Administrador ni Cliente asociado."""
        Usuario.objects.create_user(
            username="solo", email="s@test.com", password="pass1234"
        )

        usuario, rol, nombre = login_usuario("solo", "pass1234")

        self.assertIsNotNone(usuario)
        self.assertEqual(rol, "Sin rol asignado")
        self.assertEqual(nombre, "solo")  
class EliminarClienteTest(BaseUsuariosTest):

    def test_elimina_cliente_y_usuario(self):
        user_id = self.cliente.usuario_id
        ok, mensaje = eliminar_cliente(user_id)

        self.assertTrue(ok)
        self.assertIn("eliminado correctamente", mensaje)
        self.assertFalse(Cliente.objects.filter(pk=self.cliente.pk).exists())
        self.assertFalse(Usuario.objects.filter(pk=user_id).exists())

    def test_retorna_false_si_no_existe(self):
        ok, mensaje = eliminar_cliente(999999)

        self.assertFalse(ok)
        self.assertIn("no encontrado", mensaje)

    def test_no_afecta_a_otros_clientes(self):
        otro = crear_cliente("otro", "o@test.com", "pwd", "Otro")

        eliminar_cliente(self.cliente.usuario_id)

        self.assertTrue(Cliente.objects.filter(pk=otro.pk).exists())
        self.assertTrue(Usuario.objects.filter(pk=otro.usuario_id).exists())


class EliminarAdministradorTest(BaseUsuariosTest):

    def test_elimina_admin_y_usuario_sin_solicitante(self):
        user_id = self.admin.usuario_id
        ok, mensaje = eliminar_administrador(user_id)
        self.assertTrue(ok)
        self.assertIn("eliminado correctamente", mensaje)
        self.assertFalse(Administrador.objects.filter(pk=self.admin.pk).exists())
        self.assertFalse(Usuario.objects.filter(pk=user_id).exists())

    def test_retorna_false_si_no_existe(self):
        ok, mensaje = eliminar_administrador(999999)

        self.assertFalse(ok)
        self.assertIn("no encontrado", mensaje)

    def test_no_puede_eliminarse_a_si_mismo(self):
        user_id = self.admin.usuario_id

        ok, mensaje = eliminar_administrador(
            user_id, usuario_solicitante=self.admin.usuario
        )

        self.assertFalse(ok)
        self.assertIn("No puedes eliminar tu propia cuenta", mensaje)
        # Sigue existiendo
        self.assertTrue(Administrador.objects.filter(pk=self.admin.pk).exists())
        self.assertTrue(Usuario.objects.filter(pk=user_id).exists())

    def test_otro_admin_si_puede_eliminarlo(self):
        otro_admin = crear_administrador(
            "admin2", "a2@test.com", "pwd", "Admin Dos"
        )

        ok, mensaje = eliminar_administrador(
            self.admin.usuario_id,
            usuario_solicitante=otro_admin.usuario,
        )

        self.assertTrue(ok)
        self.assertFalse(Usuario.objects.filter(pk=self.admin.usuario_id).exists())

    def test_no_afecta_a_otros_administradores(self):
        otro = crear_administrador("admin2", "a2@test.com", "pwd", "Admin Dos")

        eliminar_administrador(self.admin.usuario_id)

        self.assertTrue(Administrador.objects.filter(pk=otro.pk).exists())
        self.assertTrue(Usuario.objects.filter(pk=otro.usuario_id).exists())