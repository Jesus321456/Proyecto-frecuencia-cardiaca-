from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.db.models.deletion import ProtectedError
from .models import TipoEstres
from evaluaciones.models import Diagnostico
from .service import (obtener_todos_los_tipos_estres, crear_nuevo_tipo_estres, actualizar_tipo_estres, obtener_tipo_estres_por_id, eliminar_tipo_estres,)


class BaseTipoEstresTest(TestCase):

    def setUp(self):
        self.tipo = TipoEstres.objects.create(
            nivel_estres="Alto",
            tipo_estres="Agudo",
        )

class ObtenerTodosLosTiposEstresTest(BaseTipoEstresTest):

    def test_devuelve_todos_los_registros(self):
        TipoEstres.objects.create(nivel_estres="Bajo", tipo_estres="Crónico")
        resultado = obtener_todos_los_tipos_estres()
        self.assertEqual(resultado.count(), 2)
        self.assertIn(self.tipo, resultado)

    def test_devuelve_queryset_vacio_si_no_hay_registros(self):
        TipoEstres.objects.all().delete()
        resultado = obtener_todos_los_tipos_estres()
        self.assertEqual(resultado.count(), 0)


class CrearNuevoTipoEstresTest(TestCase):
    def test_crea_y_persiste_el_registro(self):
        nuevo = crear_nuevo_tipo_estres("Medio", "Leve")
        self.assertIsNotNone(nuevo.pk)
        self.assertEqual(nuevo.nivel_estres, "Medio")
        self.assertEqual(nuevo.tipo_estres, "Leve")
        self.assertTrue(TipoEstres.objects.filter(pk=nuevo.pk).exists())

    def test_no_crea_duplicados_por_contenido(self):
        crear_nuevo_tipo_estres("Medio", "Leve")
        crear_nuevo_tipo_estres("Medio", "Leve")
        self.assertEqual(TipoEstres.objects.count(), 2)


class ActualizarTipoEstresTest(BaseTipoEstresTest):

    def test_actualiza_campos_correctamente(self):
        actualizado = actualizar_tipo_estres(
            self.tipo.id_nivel_estres, "Medio", "Crónico")

        self.assertIsNotNone(actualizado)
        self.tipo.refresh_from_db()
        self.assertEqual(self.tipo.nivel_estres, "Medio")
        self.assertEqual(self.tipo.tipo_estres, "Crónico")

    def test_retorna_none_si_no_existe(self):
        resultado = actualizar_tipo_estres(99999, "Bajo", "X")

        self.assertIsNone(resultado)

    def test_no_afecta_a_otros_registros(self):
        otro = TipoEstres.objects.create(nivel_estres="Bajo", tipo_estres="Otro")

        actualizar_tipo_estres(self.tipo.id_nivel_estres, "Medio", "Crónico")

        otro.refresh_from_db()
        self.assertEqual(otro.nivel_estres, "Bajo")
        self.assertEqual(otro.tipo_estres, "Otro")


class ObtenerTipoEstresPorIdTest(BaseTipoEstresTest):

    def test_devuelve_el_registro_correcto(self):
        resultado = obtener_tipo_estres_por_id(self.tipo.id_nivel_estres)

        self.assertIsNotNone(resultado)
        self.assertEqual(resultado.pk, self.tipo.pk)

    def test_retorna_none_si_no_existe(self):
        resultado = obtener_tipo_estres_por_id(99999)

        self.assertIsNone(resultado)


class EliminarTipoEstresTest(BaseTipoEstresTest):

    def test_elimina_cuando_no_hay_dependencias(self):
        ok, mensaje = eliminar_tipo_estres(self.tipo.id_nivel_estres)

        self.assertTrue(ok)
        self.assertIn("eliminado correctamente", mensaje)
        self.assertFalse(TipoEstres.objects.filter(pk=self.tipo.pk).exists())

    def test_retorna_false_si_no_existe(self):
        ok, mensaje = eliminar_tipo_estres(99999)

        self.assertFalse(ok)
        self.assertIn("no encontrado", mensaje)

    def test_elimina_diagnosticos_asociados_antes_del_tipo(self):
       expected_id = self.tipo.id_nivel_estres
       captured_pks = []

       def capture_filter(**kwargs):
        captured_pks.append(kwargs["tipo_estres"].pk)
        return MagicMock()

       with patch.object(Diagnostico.objects, "filter", side_effect=capture_filter):
        ok, mensaje = eliminar_tipo_estres(expected_id)

       self.assertTrue(ok)
       self.assertIn("eliminado correctamente", mensaje)
       self.assertEqual(captured_pks, [expected_id])
       self.assertFalse(TipoEstres.objects.filter(pk=expected_id).exists())

    @patch.object(TipoEstres, "delete")
    @patch.object(Diagnostico.objects, "filter")
    def test_rollback_cuando_lanza_ProtectedError(self, mock_filter, mock_delete):
        mock_filter.return_value = MagicMock()
        mock_delete.side_effect = ProtectedError("protegido", set())

        ok, mensaje = eliminar_tipo_estres(self.tipo.id_nivel_estres)

        self.assertFalse(ok)
        self.assertIn("No se puede eliminar", mensaje)
        self.assertTrue(TipoEstres.objects.filter(pk=self.tipo.pk).exists())

    @patch.object(TipoEstres, "delete")
    @patch.object(Diagnostico.objects, "filter")
    def test_captura_excepcion_generica(self, mock_filter, mock_delete):
        mock_filter.return_value = MagicMock()
        mock_delete.side_effect = RuntimeError("boom")

        ok, mensaje = eliminar_tipo_estres(self.tipo.id_nivel_estres)

        self.assertFalse(ok)
        self.assertIn("Error al eliminar", mensaje)
        self.assertIn("boom", mensaje)