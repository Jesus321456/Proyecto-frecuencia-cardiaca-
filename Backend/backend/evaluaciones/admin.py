from django.contrib import admin
from .models import Evaluacion, MedicionFisiologica, Diagnostico
@admin.register(Evaluacion)
class EvaluacionAdmin(admin.ModelAdmin):
    list_display = ('id', 'usuario', 'fecha_hora', 'hora_sueno', 'calidad_sueno', 'nivel_actividad')


@admin.register(MedicionFisiologica)
class MedicionFisiologicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'evaluacion', 'frecuencia_cardiaca', 'rmssd')


@admin.register(Diagnostico)
class DiagnosticoAdmin(admin.ModelAdmin):
    list_display = ('id', 'evaluacion', 'tipo_estres')