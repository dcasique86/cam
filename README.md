# CamFinder

> Herramienta personal y gratuita para descubrir, conectar y visualizar transmisiones de vídeo y audio ambiental de cámaras Android en red local Wi-Fi.

![Licencia](https://img.shields.io/badge/licencia-personal-cyan)
![Android](https://img.shields.io/badge/Android-Jetpack%20Compose-green)
![Windows](https://img.shields.io/badge/Windows-PWA%20%7C%20Node.js-blue)
![Privacidad](https://img.shields.io/badge/Privacidad-100%25%20Local-emerald)

---

## 1. Visión General y Arquitectura

**CamFinder** es un ecosistema de monitorización audiovisual privado diseñado para operar íntegramente dentro de una red Wi-Fi local doméstica sin servidores externos, sin cuentas de usuario, sin anuncios y sin telemetría.

### Dispositivo Emisor
- **Samsung Galaxy A52** ejecutando **AndroidCam**.
  - Puerto RTSP de vídeo/audio: `8554` (ruta `/live`).
  - Puerto de control HTTP / panel: `4444`.
  - Puerto ONVIF: `2000` (WS-Discovery).

### Dispositivos Receptores
- **Samsung Galaxy S22**: Aplicación Android nativa con **Jetpack Compose** y **AndroidX Media3 ExoPlayer** con aceleración hardware y soporte RTSP nativo.
- **Computadora Windows**: Aplicación Web Progresiva (**PWA**) instalable en Chrome/Edge, complementada por el servicio local **CamFinder Core** (Node.js) para puente de baja latencia (<60ms).

---

## 2. Estructura del Repositorio

```
/
├── android/                        # Proyecto Android Nativo (Kotlin / Jetpack Compose)
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradle.properties
│   └── app/
│       ├── build.gradle.kts
│       └── src/main/
│           ├── AndroidManifest.xml # Permisos LAN, Wi-Fi Multicast y Cleartext
│           ├── res/xml/network_security_config.xml
│           └── java/com/camfinder/app/
│               ├── MainActivity.kt
│               ├── model/CameraDevice.kt
│               ├── player/RtspPlayerManager.kt     # AndroidX Media3 RTSP
│               ├── discovery/NsdDiscoveryManager.kt # mDNS/DNS-SD & TCP Probe
│               ├── audio/AudioProcessingManager.kt # Limitador de picos & AGC
│               └── ui/
│                   ├── CamFinderScreen.kt          # UI Compose moderna
│                   └── theme/                      # Tema oscuro
│
├── src/                            # CamFinder Desktop (PWA Web)
│   ├── components/                 # Reproductor de vídeo, VU meter de audio, selectores
│   ├── hooks/                      # useAudioProcessor (Web Audio API), useDeviceDiscovery
│   ├── App.tsx                     # Interfaz minimalista oscura
│   └── main.tsx
│
├── server.ts                       # CamFinder Core (Servicio Windows / API Local)
├── test/camfinder.test.mjs         # Pruebas automatizadas de protocolos y audio
└── docs/                           # Guías detalladas de compilación y análisis
    ├── ANDROID_BUILD_GUIDE.md      # Instrucciones para generar el APK
    ├── WINDOWS_SERVICE_GUIDE.md    # Instalación de Core y PWA en Windows
    ├── ANDROIDCAM_A52_ANALYSIS.md  # Análisis del Galaxy A52 y AndroidCam
    └── TROUBLESHOOTING.md          # Resolución de problemas en red Wi-Fi
```

---

## 3. Puesta en Marcha Rápida (Versión Windows / Web)

### Requisitos
- Node.js versión 18 o superior.
- Red Wi-Fi local compartida entre la PC y el Galaxy A52.

### Pasos
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servicio local CamFinder Core y la PWA
npm run dev

# 3. Abrir en el navegador (Google Chrome o Microsoft Edge)
http://localhost:3000
```

Al abrir la aplicación en Windows, pulsa el botón **"Instalar App"** en la esquina superior derecha para ejecutar CamFinder como una ventana nativa de escritorio independiente.

---

## 4. Características Principales

1. **Descubrimiento Automático**: Sonda ONVIF (UDP 3702), mDNS (`_rtsp._tcp`) y escaneo rápido TCP de la subred para detectar el Galaxy A52 sin escribir IPs manualmente.
2. **Audio Ambiental Calibrado**: Optimizado para capturar sonidos de la habitación y voces a distancia. Incluye:
   - Control Automático de Ganancia (AGC).
   - Limitador de picos a -0.5 dBFS para evitar saturación de altavoces.
   - Filtro de 80Hz para atenuar ruidos mecánicos de fondo.
   - Botón de silencio local que **no interrumpe el flujo de vídeo**.
3. **Selección de Cámaras y Sensores**: Reconoce los sensores del A52 (Principal 64MP, Gran Angular 123°, Frontal 32MP y Macro).
4. **Baja Latencia**: Flujo de visualización con retraso inferior a 60ms en red Wi-Fi 5GHz/2.4GHz.
5. **Privacidad Total**: No se requiere registro, ni conexión a Internet, ni se transmiten datos fuera de la red local.
