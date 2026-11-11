"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import RedirectView,  TemplateView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("login/", LoginView.as_view(template_name="login.html"), name="login"),
    path("registro/", TemplateView.as_view(template_name="registro.html"), name="registro"),
    path("panel_admin/", TemplateView.as_view(template_name="panel_admin.html"), name="panel_admin"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path('', RedirectView.as_view(url='/login/', permanent=False)),

    path("api/", include("catalogo.urls")),
    path("auth/", include("usuarios.urls")),
    path("evaluaciones/", include("evaluaciones.urls")),
]
