from django.urls import path
from . import views

urlpatterns = [
    path('tipos-estres/', views.lista_tipos_estres_api, name='lista_tipos_estres')]