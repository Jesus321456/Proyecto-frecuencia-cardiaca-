from django.db import models
from django.conf import settings
from catalogo.models import TipoEstres

class Evaluacion(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='evaluaciones')
    fecha_hora = models.DateTimeField(auto_now_add=True)
    
    hora_sueno = models.FloatField(help_text="Horas de sueño (ej. 6.1)")
    calidad_sueno = models.PositiveIntegerField(help_text="Escala del 1 al 10")
    nivel_actividad = models.PositiveIntegerField(help_text="Minutos de actividad física diaria")
    presion_arterial = models.CharField(max_length=20, null=True, blank=True, help_text="Ej. 126/83")
    pasos_diarios = models.IntegerField(null=True, blank=True, help_text="Ej. 4200")
    trastorno_sueno = models.CharField(max_length=100, null=True, blank=True, help_text="Ej. Sleep Apnea, Insomnia")
    nivel_estres_reportado = models.FloatField(null=True, blank=True, help_text="Predicción de la IA")


    def _str_(self):
        return f"Evaluación {self.id} - {self.usuario.username}"
    
class MedicionFisiologica(models.Model):
    evaluacion = models.ForeignKey(Evaluacion, on_delete=models.CASCADE, related_name='mediciones')
    frecuencia_cardiaca = models.IntegerField(help_text="Latidos por minuto (Heart Rate)")
    rmssd = models.FloatField(null=True, blank=True, help_text="Valor del RMSSD")

    def _str_(self):
        return f"Medición de Evaluación {self.evaluacion.id}"

class Diagnostico(models.Model):
    evaluacion = models.OneToOneField(Evaluacion, on_delete=models.CASCADE, related_name='diagnostico')    
    tipo_estres = models.ForeignKey(TipoEstres, on_delete=models.CASCADE)

    def _str_(self):
        return f"Diagnóstico de Eval. {self.evaluacion.id} - {self.tipo_estres.tipo_estres}"