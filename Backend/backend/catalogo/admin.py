from django.contrib import admin
from .models import TipoEstres

@admin.register(TipoEstres)
class TipoEstresAdmin(admin.ModelAdmin):
    list_display = ('id_nivel_estres', 'tipo_estres', 'nivel_estres')