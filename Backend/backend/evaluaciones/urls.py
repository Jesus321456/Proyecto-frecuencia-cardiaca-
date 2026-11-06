from django.urls import path
from . import views

urlpatterns = [
    path('actualizar/<int:pk>/', views.actualizar_informacion_cliente_api, name="evaluacion_cliente"),
    path('crear/<int:usuario_id>/', views.crear_evaluacion_api, name='crear_evaluacion'),
    path('medicion-bluetooth/<int:evaluacion_id>/', views.iniciar_medicion_banda_api, name='iniciar_medicion_bluetooth'),
    path('predecir/<int:evaluacion_id>/', views.predecir_estres_api, name='predecir_estres')]