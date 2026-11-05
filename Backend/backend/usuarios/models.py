from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    def _str_(self):
        return self.email


class Administrador(models.Model):
   
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='admin')
    nombre = models.CharField(max_length=150)

    def _str_(self):
        return f"Admin: {self.nombre}"

class Cliente(models.Model):
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='cliente')
    nombre = models.CharField(max_length=150)
    edad = models.PositiveIntegerField(null=True, blank=True)
    genero = models.CharField(max_length=20, null=True, blank=True)
    ocupacion = models.CharField(max_length=100, null=True, blank=True)
    peso = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    estatura = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    categoria_imc = models.CharField(max_length=50, null=True, blank=True)


    def _str_(self):
        return f"Cliente: {self.nombre}"