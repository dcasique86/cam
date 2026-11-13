# Análisis Técnico: Samsung Galaxy A52 y AndroidCam

Este documento detalla la arquitectura de hardware del **Samsung Galaxy A52** (modelo `SM-A525F`), las capacidades del software emisor **AndroidCam**, y el comportamiento de los protocolos de red (RTSP, ONVIF, HTTP).

---

## 1. Sensores de Cámara del Samsung Galaxy A52

El Galaxy A52 integra un conjunto de 5 sensores ópticos (4 traseros y 1 frontal):

| Sensor | Resolución | Apertura | Campo de Visión (FOV) | Estabilización | Rol en CamFinder |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Trasera Principal** | 64 MP (Quad Bayer a 16 MP) | f/1.8 | 81° | Óptica (OIS) | Sensor principal por defecto. Máxima nitidez y rendimiento con poca luz. |
| **Ultra Gran Angular** | 12 MP | f/2.2 | 123° | Digital | Cobertura panorámica completa de una habitación grande o pasillo. |
| **Macro** | 5 MP | f/2.4 | 85° | No | Enfoque a corta distancia (3–5 cm). |
| **Profundidad** | 5 MP | f/2.4 | - | - | Sensor de soporte para mapas de profundidad (no emite flujo de vídeo directo). |
| **Frontal Selfie** | 32 MP | f/2.2 | 80° | Digital | Transmisión inversa cuando el teléfono está apoyado contra una superficie. |

---

## 2. Puertos y Servicios de AndroidCam

Cuando la aplicación AndroidCam está activa en el Galaxy A52, expone tres servicios en la red local:

### A. Puerto RTSP `8554` (Ruta `/live`)
- **Protocolo**: Real-Time Streaming Protocol (RFC 2326).
- **Transporte de Medios**: RTP/RTCP encapsulado sobre TCP (interleaved) o UDP.
- **Códec de Vídeo**: H.264 (AVC Baseline o Main Profile).
- **Códec de Audio**: AAC-LC a 48 kHz o Linear PCM mono/estéreo.
- **Características**: Diseñado exclusivamente para transporte unidireccional de flujo multimedia.

### B. Puerto HTTP/HTTPS `4444` (Panel de Control Web)
- **Función**: Panel de administración web de AndroidCam.
- **Capacidades**:
  - Consulta de estado del teléfono (nivel de batería, temperatura, FPS reales).
  - Listado de cámaras detectadas por la API `android.hardware.camera2`.
  - Control de sensor activo (conmutación entre cámara trasera y delantera).
  - Control de linterna / flash LED.
  - Ajuste de exposición y balance de blancos.

### C. Puerto ONVIF `2000` (Perfil S - Video Transmitter)
- **Protocolo**: Web Services Discovery (WS-Discovery) mediante SOAP sobre UDP `239.255.255.250:3702`.
- **Función**: Anuncio automático de la cámara para NVRs, receptores y clientes compatibles con ONVIF.

---

## 3. Comportamiento y Limitaciones de la Selección de Cámaras

### Limitación Estándar de RTSP
El protocolo RTSP estándar (`DESCRIBE`, `SETUP`, `PLAY`, `PAUSE`, `TEARDOWN`) **no incluye comandos para cambiar físicamente el sensor de cámara de un teléfono**. 
RTSP transporta el flujo que la aplicación emisora le proporciona al encoder en ese instante.

### Solución Implementada en CamFinder
1. **Canal Dual**:
   - CamFinder escucha el flujo RTSP en el puerto `8554`.
   - Cuando el usuario solicita cambiar de sensor (por ejemplo, de la cámara de 64MP a la Ultra Gran Angular de 123° o a la frontal de 32MP), CamFinder Core envía una petición de control al puerto `4444` de AndroidCam.
2. **Reconexión Transparente**:
   - Al cambiar de lente, AndroidCam reinicia brevemente el pipeline de la API `camera2`.
   - La máquina de estados de CamFinder (tanto en AndroidX Media3 como en la PWA) detecta la pausa y restablece el enlace en menos de 1.5 segundos sin requerir intervención del usuario.
3. **Documentación de Fallback**:
   - Si una versión reducida de AndroidCam tiene deshabilitado el panel del puerto `4444`, CamFinder registra el sensor solicitado en la interfaz e informa al usuario de que el cambio físico de lente debe seleccionarse en la app del A52.

---

## 4. Calibración del Audio Ambiental

El micrófono del Galaxy A52 tiene alta sensibilidad para frecuencias de voz humana (300 Hz a 3.4 kHz) pero puede capturar resonancias bajas de aire acondicionado o ventiladores (50 Hz - 70 Hz).

### Pipeline de Audio de CamFinder:
1. **Filtro Pasa-Altos de 80 Hz**: Elimina el retumbe mecánico sin alterar voces masculinas ni sonidos ambientales normales.
2. **Control Automático de Ganancia (AGC)**: Detecta caídas en el nivel RMS e incrementa gradualmente la ganancia (hasta un máximo seguro de 4.0x) para permitir oír susurros o ruidos lejanos en la habitación.
3. **Limitador de Picos a -0.5 dBFS**: Si se produce un portazo o un sonido repentino, el limitador reacciona en 3 milisegundos (`attack = 0.003s`) aplicando compresión para evitar clipping digital o daño a los altavoces receptores.
