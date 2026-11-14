# Proyecto-frecuencia-cardiaca-

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20?style=flat&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/Django_REST_Framework-A30000?style=flat&logo=django&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-555555?style=flat&logo=docker&logoColor=white)

Sistema de monitoreo de frecuencia cardíaca con diagnóstico de estrés mediante
un modelo de **Random Forest** y captura de datos por Bluetooth Low Energy (BLE).
---

## 📑 Tabla de Contenidos

- [✨ Características](#características)
- [🛠️ Tecnologías](#tecnologías)
- [🚀 Instalación](#instalación)
- [📖 Uso](#uso)
- [🧪 Pruebas](#pruebas)
- [📁 Estructura del Proyecto](#estructura-del-proyecto)
- [🤝 Contribuciones](#contribuciones)
- [📄 Licencia](#licencia)

---

## ✨ Características

- **API REST limpia y bien documentada**
- **Anotaciones de tipo y documentación completa**
- **Soporte de Docker para despliegue en contenedores**
- **Modelo de Machine Learning (Random Forest)** para predecir el nivel de estrés
- **Captura de frecuencia cardíaca vía BLE** (banda con sensor de pulso)
- **Frontend en HTML, CSS y JavaScript**

---

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| **Lenguaje** | Python |
| **Framework Backend** | Django, Django REST Framework |
| **Machine Learning** | Scikit-learn, Pandas, Joblib, NumPy |
| **Hardware** | Bluetooth Low Energy (Bleak) |
| **Base de Datos** | PostgreSQL |
| **DevOps** | Docker, Docker Compose |
| **Frontend** | HTML, CSS, JavaScript |

---

## 🚀 Instalación

### Requisitos previos

- Python 3.10+
- pip
- Docker (opcional)

### Configuración

```bash
# Clonar el repositorio
git clone https://github.com/Jesus321456/Proyecto-frecuencia-cardiaca-.git
cd Proyecto-frecuencia-cardiaca-

# Crear y activar el entorno virtual
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate


---

## 📖 Uso

```bash
python manage.py runserver
```

### Docker

```bash
docker build -t Proyecto-frecuencia-cardiaca- .
docker run -p 8000:8000 Proyecto-frecuencia-cardiaca-
```

---

## 📁 Estructura del proyecto

```
Proyecto-frecuencia-cardiaca-/
├── Backend/
│   ├── backend/
│   │   ├── catalogo/
│   │   ├── evaluaciones/
│   │   ├── Modelo/
│   │   └── usuarios/
│   └── frontend/
│       ├── CSS/
│       ├── HTML/
│       ├── Js/
│       └── static/
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── Ejecutable/
│   └── Link_Sitio.txt
├── Frontend/
│   └── Doc/
│       └── PROYECTO-FRECUENCIAA-ORIGINAL.pdf
├── Fullstack/
│   ├── 1.-CreacionPlantillasPrototipo.png
│   ├── 10.-CreacionModeloRandomForest.png
│   ├── 11.-DocDesarrollorSoftware.png
│   ├── 12.-CreacionConexionBaseDatos.png
│   ├── 13.-CreacionEntidadesSistema.png
│   ├── 14.-CreacionServiciosControladores.png
│   ├── 15.-CreacionPantallaAdministrador.png
│   ├── 16.-CreacionPantallaLogin.png
│   ├── 17.-CreacionPantallaFormulario.png
│   ├── 18.-CreacionPantallaResultados.png
│   ├── 19.-DocAgregarCapturasBeta.png
│   ├── 2.-CreacionRepositorioGitHub.png
│   ├── 20.-CreacionPantallaInicio.png
│   ├── 3.-CreacionCarpetasGithub.png
│   ├── 4.-CreacionRamasGitHub.png
│   ├── 5.-DocSecciónRepositorio.png
│   ├── 6.-CreacionBaseSQL.png
│   ├── 7.-DocModificacionSeccionContenido.png
│   ├── 8.-CreacionInterfazBeta.png
│   └── 9.-DocModificacionPantallasPrototipo.png
├── db.sqlite3
├── docker-compose.yaml
├── Dockerfile
├── manage.py
├── README.md
└── requirements.txt
```
