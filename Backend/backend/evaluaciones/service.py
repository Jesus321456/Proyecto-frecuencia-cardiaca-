import numpy as np
import asyncio
import sys
import os
from django.conf import settings
import pandas as pd
import joblib
import os
from django.conf import settings
from django.db import transaction
from usuarios.models import Cliente 
from catalogo.models import TipoEstres
from .models import Evaluacion, Diagnostico, MedicionFisiologica
from bleak import BleakClient

RUTA_MODELO = os.path.join(settings.BASE_DIR, 'Backend/backend/Modelo/modelo_random_forest.joblib')
RUTA_COLUMNAS = os.path.join(settings.BASE_DIR, 'Backend/backend/Modelo/columnas_modelo.joblib')


if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

DEVICE_ADDRESS = "EE:FC:74:99:22:C1"
HEART_RATE_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb"

def actualizar_informacion_cliente(usuario_id, datos_actualizados):
    try:
        cliente = Cliente.objects.get(usuario_id=usuario_id)
        cliente.genero = datos_actualizados.get('genero', cliente.genero)
        cliente.edad = datos_actualizados.get('edad', cliente.edad)
        cliente.ocupacion = datos_actualizados.get('ocupacion', cliente.ocupacion)
        cliente.peso = datos_actualizados.get('peso', cliente.peso)
        cliente.estatura = datos_actualizados.get('estatura', cliente.estatura)

        if 'categoria_imc' in datos_actualizados:
            cliente.categoria_imc = datos_actualizados['categoria_imc']
        elif cliente.peso and cliente.estatura:
            imc = float(cliente.peso) / (float(cliente.estatura) ** 2)
            if imc < 18.5: cliente.categoria_imc = "Underweight"
            elif imc < 25: cliente.categoria_imc = "Normal"
            elif imc < 30: cliente.categoria_imc = "Overweight"
            else: cliente.categoria_imc = "Obese"

        cliente.save()
        return cliente
    except Cliente.DoesNotExist:
        return None

def crear_evaluacion(usuario_id, datos_evaluacion):
    try:
        cliente = Cliente.objects.get(usuario_id=usuario_id)
        evaluacion = Evaluacion.objects.create(
            usuario=cliente.usuario,
            hora_sueno=datos_evaluacion.get('hora_sueno'),
            calidad_sueno=datos_evaluacion.get('calidad_sueno'),
            nivel_actividad=datos_evaluacion.get('nivel_actividad'),
            presion_arterial=datos_evaluacion.get('presion_arterial'),
            pasos_diarios=datos_evaluacion.get('pasos_diarios'),
            trastorno_sueno=datos_evaluacion.get('trastorno_sueno'),
        )
        return evaluacion
    except Cliente.DoesNotExist:
        return None

def _ejecutar_modelo_ia(datos_usuario):
    modelo = joblib.load(RUTA_MODELO)
    columnas = joblib.load(RUTA_COLUMNAS)
    
    df_entrada = pd.DataFrame([datos_usuario])
    df_entrada['Gender'] = df_entrada['Gender'].map({'Male': 0, 'Female': 1})
    df_entrada['BMI Category'] = df_entrada['BMI Category'].replace('Normal Weight', 'Normal').map({'Normal': 0, 'Overweight': 1, 'Obese': 2})
    df_entrada['Sleep Disorder'] = df_entrada['Sleep Disorder'].fillna('None')
    
    df_entrada = pd.get_dummies(df_entrada, columns=['Occupation', 'Sleep Disorder'])
    X_nuevo = df_entrada.reindex(columns=columnas, fill_value=0)
    
    prediccion = modelo.predict(X_nuevo)
    return prediccion[0]

def predecir_y_actualizar_evaluacion(evaluacion_id):
    try:
        evaluacion = Evaluacion.objects.get(id=evaluacion_id)
        cliente = evaluacion.usuario.cliente 
        medicion = evaluacion.mediciones.first() 
        
        if not medicion:
            return None, None, None, "No hay medición fisiológica para esta evaluación."

        datos_random = {
            'Gender': cliente.genero,
            'Age': cliente.edad,
            'Occupation': cliente.ocupacion,
            'BMI Category': cliente.categoria_imc,
            'Sleep Duration': evaluacion.hora_sueno,
            'Quality of Sleep': evaluacion.calidad_sueno,
            'Physical Activity Level': evaluacion.nivel_actividad,
            'Blood Pressure': evaluacion.presion_arterial or "120/80",
            'Daily Steps': evaluacion.pasos_diarios,
            'Sleep Disorder': evaluacion.trastorno_sueno,
            'Heart Rate': medicion.frecuencia_cardiaca,
            'RMSSD': medicion.rmssd
        }

        prediccion = _ejecutar_modelo_ia(datos_random)
        
        evaluacion.nivel_estres_reportado = float(prediccion)
        evaluacion.save()
        
        if prediccion <= 3:
            nivel_texto = "Bajo"
        elif prediccion <= 7:
            nivel_texto = "Medio"
        else:
            nivel_texto = "Alto"
            
        tipo_estres_obj = TipoEstres.objects.filter(nivel_estres=nivel_texto).first()
        
        tipo_estres_texto = None 
        
        if tipo_estres_obj:
            generar_diagnostico(evaluacion.id, tipo_estres_obj.id_nivel_estres)
            tipo_estres_texto = tipo_estres_obj.tipo_estres 
                
        return prediccion, nivel_texto, tipo_estres_texto, None

    except Exception as e:
        print(f"Error en predicción: {e}")
        return None, None, None, str(e)


def _calcular_rmssd(intervalos_rr):
    if len(intervalos_rr) < 2:
        return None 
    
    rr_ms = np.array(intervalos_rr) * 1000
    diffs = np.diff(rr_ms)
    diffs_cuadrados = diffs ** 2
    media_cuadrados = np.mean(diffs_cuadrados)
    rmssd = np.sqrt(media_cuadrados)
    
    return round(rmssd, 2)

async def _obtener_frecuencia_ble(duracion_segundos=60):
    frecuencias = []
    intervalos_rr = [] 

    def heart_rate_handler(sender, data):
        flags = data[0]
        if flags & 0x01:
            heart_rate = int.from_bytes(data[1:3], byteorder='little')
            offset = 3
        else:
            heart_rate = data[1]
            offset = 2
        
        frecuencias.append(heart_rate)
        print(f"Frecuencia cardíaca capturada: {heart_rate} bpm")

        if flags & 0x10:  
            print("  ¡Intervalos RR detectados!")
            while offset < len(data):
                rr_raw = int.from_bytes(data[offset:offset+2], byteorder='little')
                rr_segundos = rr_raw / 1024.0
                intervalos_rr.append(rr_segundos)
                offset += 2

    try:
        print(f"Intentando conectar a {DEVICE_ADDRESS}...")
        async with BleakClient(DEVICE_ADDRESS) as client:
            print(f"Conectado. Midiendo por {duracion_segundos} segundos...")
            await client.start_notify(HEART_RATE_MEASUREMENT_UUID, heart_rate_handler)
            
            # Esperamos los 60 segundos
            await asyncio.sleep(duracion_segundos)
            
            await client.stop_notify(HEART_RATE_MEASUREMENT_UUID)
            
    except Exception as e:
        print(f"Error de conexión Bluetooth: {e}")
        return None, None  

    promedio_fc = round(np.mean(frecuencias), 2) if frecuencias else None
    rmssd = _calcular_rmssd(intervalos_rr) if intervalos_rr else None
    
    return promedio_fc, rmssd

def medir_y_guardar_frecuencia(evaluacion_id, duracion=60):
    promedio_fc, rmssd_valor = asyncio.run(_obtener_frecuencia_ble(duracion_segundos=duracion))
    
    if promedio_fc is None:
        return None, "No se pudo conectar a la banda o no se recibieron datos."

    try:
        evaluacion = Evaluacion.objects.get(id=evaluacion_id)
        
        medicion = MedicionFisiologica.objects.create(
            evaluacion=evaluacion,
            frecuencia_cardiaca=promedio_fc,
            rmssd=rmssd_valor 
        )
        return medicion, None
        
    except Evaluacion.DoesNotExist:
        return None, "La evaluación especificada no existe."

def generar_diagnostico(evaluacion_id, tipo_estres_id):
    try:
        evaluacion = Evaluacion.objects.get(id=evaluacion_id)
        tipo_estres = TipoEstres.objects.get(id_nivel_estres=tipo_estres_id)
        
        diagnostico, created = Diagnostico.objects.get_or_create(
            evaluacion=evaluacion,
            defaults={'tipo_estres': tipo_estres}
        )
        
        if not created:
            diagnostico.tipo_estres = tipo_estres
            diagnostico.save()
            
        return diagnostico
    except (Evaluacion.DoesNotExist, TipoEstres.DoesNotExist):
        return None