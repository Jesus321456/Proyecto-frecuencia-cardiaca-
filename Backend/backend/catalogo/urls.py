from django.urls import path
from . import views

urlpatterns = [
    path('tipos-estres/', views.lista_tipos_estres_api, name='lista_tipos_estres'),
    path('tipos-estres/crear/', views.crear_tipo_estres_api, name='crear_tipo_estres'),
    path('tipos-estres/<int:id>/', views.obtiene_tipo_estres_por_id_api, name='obtiene_estres_por_id'),
    path('tipos-estres/actualizar/<int:pk>/', views.actualizar_tipo_estres_api, name="actualizar_tipo_estres"),
    path('tipos-estres/eliminar/<int:pk>/',   views.eliminar_tipo_estres_api, name="eliminar_tipo_estres"),
]