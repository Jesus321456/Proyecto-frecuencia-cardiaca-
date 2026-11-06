from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Cliente, Administrador

admin.site.register(Usuario, UserAdmin)
admin.site.register(Cliente)
admin.site.register(Administrador)