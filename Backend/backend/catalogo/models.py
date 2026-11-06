from django.db import models

class TipoEstres(models.Model):
    id_nivel_estres = models.AutoField(primary_key=True)
    nivel_estres = models.CharField(max_length=50, help_text="Ej: Bajo, Medio, Alto")
    tipo_estres = models.CharField(max_length=300, help_text="Ej: descripción del tipo de estrés")

    def __str__(self):
        return f"{self.tipo_estres} ({self.nivel_estres})"