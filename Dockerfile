FROM python:3.13-slim
# Evita que Python escriba archivos temporales y manda la salida a la terminal
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiar dependencias e instalarlas
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copiar el resto del proyecto
COPY . /app/

# Exponer el puerto
EXPOSE 8000

# Comando para iniciar
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]