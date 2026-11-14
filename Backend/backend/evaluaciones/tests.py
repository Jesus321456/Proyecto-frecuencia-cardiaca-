from unittest.mock import patch, MagicMock
import numpy as np
from django.test import TestCase
from django.contrib.auth import get_user_model
from usuarios.models import Cliente
from catalogo.models import TipoEstres
from .models import Evaluacion, Diagnostico, MedicionFisiologica

from .service import (actualizar_informacion_cliente, crear_evaluacion, _ejecutar_modelo_ia, predecir_y_actualizar_evaluacion, _calcular_rmssd,medir_y_guardar_frecuencia,generar_diagnostico,)

Usuario = get_user_model()

class BaseEvaluacionTest(TestCase):

    def setUp(self):
        self.user = Usuario.objects.create_user(
            username="paciente", email="p@test.com", password="pwd1234"
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            nombre="Paciente",
            genero="Male",
            edad=30,
            ocupacion="Engineer",
            peso=70.0,
            estatura=1.75,
            categoria_imc="Normal",
        )
        self.tipo_bajo = TipoEstres.objects.create(
            nivel_estres="Bajo", tipo_estres="Leve"
        )
        self.tipo_medio = TipoEstres.objects.create(
            nivel_estres="Medio", tipo_estres="Moderado"
        )
        self.tipo_alto = TipoEstres.objects.create(
            nivel_estres="Alto", tipo_estres="Agudo"
        )
        self.evaluacion = Evaluacion.objects.create(
            usuario=self.user,
            hora_sueno=7.5,
            calidad_sueno=7,
            nivel_actividad=60,
            presion_arterial="120/80",
            pasos_diarios=8000,
            trastorno_sueno=None,
        )
        self.medicion = MedicionFisiologica.objects.create(
            evaluacion=self.evaluacion,
            frecuencia_cardiaca=72.0,
            rmssd=35.0,
        )


class ActualizarInformacionClienteTest(BaseEvaluacionTest):

    def test_actualiza_campos_basicos(self):
        actualizado = actualizar_informacion_cliente(
            self.user.id,
            {"edad": 35, "ocupacion": "Doctor", "peso": 75.0},
        )

        self.assertIsNotNone(actualizado)
        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.edad, 35)
        self.assertEqual(self.cliente.ocupacion, "Doctor")
        self.assertEqual(self.cliente.peso, 75.0)
        self.assertEqual(self.cliente.genero, "Male")

    def test_recalcula_imc_cuando_no_se_envia(self):
        actualizar_informacion_cliente(
            self.user.id, {"peso": 90.0, "estatura": 1.75}
        )

        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.categoria_imc, "Overweight")

    def test_usa_categoria_imc_si_se_envia(self):
        actualizar_informacion_cliente(
            self.user.id,
            {"peso": 50.0, "estatura": 1.75, "categoria_imc": "Obese"},
        )

        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.categoria_imc, "Obese")

    def test_recalcula_imc_underweight(self):
        actualizar_informacion_cliente(
            self.user.id, {"peso": 50.0, "estatura": 1.75}
        )

        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.categoria_imc, "Underweight")

    def test_retorna_none_si_cliente_no_existe(self):
        resultado = actualizar_informacion_cliente(999999, {"edad": 40})
        self.assertIsNone(resultado)



class CrearEvaluacionTest(BaseEvaluacionTest):

    def test_crea_evaluacion_con_datos(self):
        datos = {
            "hora_sueno": 8.0,
            "calidad_sueno": 8,
            "nivel_actividad": 70,
            "presion_arterial": "115/75",
            "pasos_diarios": 10000,
            "trastorno_sueno": "Insomnia",
        }

        evaluacion = crear_evaluacion(self.user.id, datos)

        self.assertIsNotNone(evaluacion)
        self.assertEqual(evaluacion.usuario, self.user)
        self.assertEqual(evaluacion.hora_sueno, 8.0)
        self.assertEqual(evaluacion.trastorno_sueno, "Insomnia")
        self.assertTrue(Evaluacion.objects.filter(pk=evaluacion.pk).exists())

    def test_retorna_none_si_cliente_no_existe(self):
        resultado = crear_evaluacion(999999, {"hora_sueno": 7})
        self.assertIsNone(resultado)



class CalcularRmssdTest(TestCase):

    def test_lista_vacia_devuelve_none(self):
        self.assertIsNone(_calcular_rmssd([]))

    def test_un_solo_valor_devuelve_none(self):
        self.assertIsNone(_calcular_rmssd([0.8]))

    def test_dos_valores_calcula_correctamente(self):
        self.assertEqual(_calcular_rmssd([0.8, 0.9]), 100.0)

    def test_tres_valores_calcula_correctamente(self):
        self.assertEqual(_calcular_rmssd([0.8, 0.9, 1.0]), 100.0)

    def test_cuatro_valores_con_redondeo(self):
        self.assertEqual(_calcular_rmssd([0.8, 0.85, 0.9, 1.0]), 70.71)


class EjecutarModeloIaTest(TestCase):

    def _datos_ejemplo(self):
        return {
            "Gender": "Male",
            "Age": 30,
            "Occupation": "Engineer",
            "BMI Category": "Normal",
            "Sleep Duration": 7.5,
            "Quality of Sleep": 7,
            "Physical Activity Level": 60,
            "Blood Pressure": "120/80",
            "Daily Steps": 8000,
            "Sleep Disorder": None,
            "Heart Rate": 72.0,
            "RMSSD": 35.0,
        }

    def test_devuelve_prediccion_del_modelo(self):
        fake_model = MagicMock()
        fake_model.predict.return_value = np.array([5.0])
        fake_columns = [
            "Gender", "Age", "BMI Category", "Sleep Duration",
            "Quality of Sleep", "Physical Activity Level",
            "Daily Steps", "Heart Rate", "RMSSD",
        ]

        with patch("evaluaciones.service.joblib.load",
                   side_effect=[fake_model, fake_columns]):
            resultado = _ejecutar_modelo_ia(self._datos_ejemplo())

        self.assertEqual(resultado, 5.0)
        fake_model.predict.assert_called_once()

    def test_mapea_genero_y_bmi_correctamente(self):
        fake_model = MagicMock()
        fake_model.predict.return_value = np.array([3.0])
        fake_columns = ["Gender", "BMI Category"]

        with patch("evaluaciones.service.joblib.load",
                   side_effect=[fake_model, fake_columns]):
            _ejecutar_modelo_ia(self._datos_ejemplo())

        X_pasado = fake_model.predict.call_args[0][0]
        self.assertEqual(X_pasado.iloc[0]["Gender"], 0)
        self.assertEqual(X_pasado.iloc[0]["BMI Category"], 0)


class PredecirYActualizarEvaluacionTest(BaseEvaluacionTest):

    def test_prediccion_baja(self):
        with patch("evaluaciones.service._ejecutar_modelo_ia",
                   return_value=2.0):
            pred, nivel, tipo, error = predecir_y_actualizar_evaluacion(
                self.evaluacion.id
            )

        self.assertEqual(pred, 2.0)
        self.assertEqual(nivel, "Bajo")
        self.assertEqual(tipo, "Leve")
        self.assertIsNone(error)
        self.evaluacion.refresh_from_db()
        self.assertEqual(self.evaluacion.nivel_estres_reportado, 2.0)
        self.assertTrue(
            Diagnostico.objects.filter(
                evaluacion=self.evaluacion, tipo_estres=self.tipo_bajo
            ).exists()
        )

    def test_prediccion_media(self):
        with patch("evaluaciones.service._ejecutar_modelo_ia",
                   return_value=5.0):
            _, nivel, tipo, _ = predecir_y_actualizar_evaluacion(
                self.evaluacion.id
            )

        self.assertEqual(nivel, "Medio")
        self.assertEqual(tipo, "Moderado")

    def test_prediccion_alta(self):
        with patch("evaluaciones.service._ejecutar_modelo_ia",
                   return_value=9.0):
            _, nivel, tipo, _ = predecir_y_actualizar_evaluacion(
                self.evaluacion.id
            )

        self.assertEqual(nivel, "Alto")
        self.assertEqual(tipo, "Agudo")

    def test_sin_medicion_retorna_mensaje(self):
        self.medicion.delete()

        pred, nivel, tipo, error = predecir_y_actualizar_evaluacion(
                self.evaluacion.id
    )

        self.assertIsNone(pred)
        self.assertIsNone(nivel)
        self.assertIsNone(tipo)
        self.assertEqual(error, "No hay medición fisiológica para esta evaluación.")

    def test_evaluacion_no_existe_retorna_error(self):
        pred, nivel, tipo, error = predecir_y_actualizar_evaluacion(999999)

        self.assertIsNone(pred)
        self.assertIsNone(nivel)
        self.assertIsNone(tipo)
        self.assertIsNotNone(error)

    def test_tipo_estres_no_existe_no_genera_diagnostico(self):
        """Si no hay TipoEstres que matchee el nivel, no se genera Diagnóstico."""
        TipoEstres.objects.all().delete()

        with patch("evaluaciones.service._ejecutar_modelo_ia",
                   return_value=5.0):
            pred, nivel, tipo, error = predecir_y_actualizar_evaluacion(
                self.evaluacion.id
            )

        self.assertEqual(pred, 5.0)
        self.assertEqual(nivel, "Medio")
        self.assertIsNone(tipo) 
        self.assertIsNone(error)
        self.assertFalse(
            Diagnostico.objects.filter(evaluacion=self.evaluacion).exists()
        )

    def test_actualiza_diagnostico_existente(self):
        """Si ya hay diagnóstico, se actualiza al nuevo tipo."""
        Diagnostico.objects.create(
            evaluacion=self.evaluacion, tipo_estres=self.tipo_bajo
        )

        with patch("evaluaciones.service._ejecutar_modelo_ia",
                   return_value=9.0):
            predecir_y_actualizar_evaluacion(self.evaluacion.id)

        diag = Diagnostico.objects.get(evaluacion=self.evaluacion)
        self.assertEqual(diag.tipo_estres, self.tipo_alto)


class MedirYGuardarFrecuenciaTest(BaseEvaluacionTest):

    def test_guarda_medicion_cuando_hay_datos(self):
        with patch("evaluaciones.service.asyncio.run",
                   return_value=(78.5, 42.3)):
            medicion, error = medir_y_guardar_frecuencia(self.evaluacion.id)

        self.assertIsNone(error)
        self.assertIsNotNone(medicion)
        self.assertEqual(medicion.frecuencia_cardiaca, 78.5)
        self.assertEqual(medicion.rmssd, 42.3)
        self.assertEqual(medicion.evaluacion_id, self.evaluacion.id)

    def test_retorna_error_si_no_hay_conexion(self):
        with patch("evaluaciones.service.asyncio.run",
                   return_value=(None, None)):
            medicion, error = medir_y_guardar_frecuencia(self.evaluacion.id)

        self.assertIsNone(medicion)
        self.assertIn("No se pudo conectar", error)
        self.assertEqual(MedicionFisiologica.objects.count(), 1)  

    def test_retorna_error_si_evaluacion_no_existe(self):
        with patch("evaluaciones.service.asyncio.run",
                   return_value=(80.0, 40.0)):
            medicion, error = medir_y_guardar_frecuencia(999999)

        self.assertIsNone(medicion)
        self.assertIn("no existe", error)

class GenerarDiagnosticoTest(BaseEvaluacionTest):

    def test_crea_diagnostico_si_no_existe(self):
        diag = generar_diagnostico(
            self.evaluacion.id, self.tipo_medio.id_nivel_estres
        )

        self.assertIsNotNone(diag)
        self.assertEqual(diag.tipo_estres, self.tipo_medio)
        self.assertEqual(
            Diagnostico.objects.filter(evaluacion=self.evaluacion).count(), 1
        )

    def test_actualiza_si_ya_existe(self):
        Diagnostico.objects.create(
            evaluacion=self.evaluacion, tipo_estres=self.tipo_bajo
        )

        diag = generar_diagnostico(
            self.evaluacion.id, self.tipo_alto.id_nivel_estres
        )

        self.assertEqual(diag.tipo_estres, self.tipo_alto)
        self.assertEqual(Diagnostico.objects.count(), 1) 

    def test_retorna_none_si_evaluacion_no_existe(self):
        resultado = generar_diagnostico(999999, self.tipo_medio.id_nivel_estres)
        self.assertIsNone(resultado)

    def test_retorna_none_si_tipo_estres_no_existe(self):
        resultado = generar_diagnostico(self.evaluacion.id, 999999)
        self.assertIsNone(resultado)
