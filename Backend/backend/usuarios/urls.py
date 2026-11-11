from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_api, name='login'),
    path('administrador/crear/', views.registro_admin_api, name='crear_administrador'),
    path('clientes/', views.lista_clientes_api, name='lista_clientes'),
    path('clientes/crear/', views.registro_cliente_api, name='crear_cliente'),
    path('administradores/', views.lista_adminstradores_api, name='lista_administradores'),
    path('administradores/<int:admin_id>/', views.eliminar_administrador_api, name='eliminar_administrador'),
    path('clientes/<int:cliente_id>/', views.eliminar_cliente_api, name='eliminar_cliente'),  
]