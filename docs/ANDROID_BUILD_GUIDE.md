# Guía de Compilación e Instalación de CamFinder Android (APK)

Esta guía explica paso a paso cómo compilar el proyecto nativo de Android en formato APK e instalarlo en tu **Samsung Galaxy S22** (o cualquier dispositivo Android 7.0 / API 24 o superior).

---

## 1. Requisitos Previos

- **Android Studio Ladybug (2024.2+)** o superior instalado en tu PC (Windows, macOS o Linux).
- **Android SDK Platform 35** y Android SDK Build-Tools.
- **Java Development Kit (JDK)**: JDK 17 o superior.
- Tu teléfono **Samsung Galaxy S22** conectado a la misma red Wi-Fi que el Galaxy A52.

---

## 2. Apertura del Proyecto en Android Studio

1. Abre Android Studio.
2. Selecciona **File > Open...** (Abrir proyecto existente).
3. Navega hasta la carpeta `/android` de este repositorio y pulsa **OK**.
4. Android Studio sincronizará automáticamente los archivos de Gradle (`settings.gradle.kts` y `app/build.gradle.kts`).
5. Espera a que finalice la descarga de dependencias (AndroidX Media3 ExoPlayer RTSP, Jetpack Compose, Coroutines).

---

## 3. Compilación del APK

### Opción A: Mediante la interfaz gráfica de Android Studio
1. En el menú superior, selecciona **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Al finalizar el proceso (suele tardar 1 o 2 minutos en la primera ejecución), aparecerá una notificación emergente en la esquina inferior derecha:
   `APK(s) generated successfully for 1 module: app-debug.apk`.
3. Haz clic en **locate** para abrir la carpeta donde se ha generado el archivo:
   `android/app/build/outputs/apk/debug/app-debug.apk`.

### Opción B: Mediante terminal / línea de comandos (Windows PowerShell / Bash)
Abre una terminal en el directorio `android/` y ejecuta:

**En Windows:**
```powershell
.\gradlew.bat assembleDebug
```

**En Linux / macOS:**
```bash
chmod +x gradlew
./gradlew assembleDebug
```

El APK resultante se ubicará en:
`android/app/build/outputs/apk/debug/app-debug.apk`

Para compilar la versión optimizada Release sin depurador:
```bash
./gradlew assembleRelease
```

---

## 4. Instalación en el Samsung Galaxy S22

### Método 1: Instalación directa por USB con ADB (Recomendado)
1. En tu Samsung Galaxy S22, activa las **Opciones de desarrollador**:
   - Ve a **Ajustes > Acerca del teléfono > Información de software**.
   - Pulsa 7 veces consecutivas sobre **Número de compilación**.
2. Entra en **Ajustes > Opciones de desarrollador** y activa **Depuración por USB**.
3. Conecta el S22 a la PC mediante cable USB y acepta el mensaje de "Permitir depuración por USB".
4. Desde la terminal en tu PC, instala el archivo directamente:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Método 2: Transferencia directa de archivo
1. Copia el archivo `app-debug.apk` a la memoria interna de tu Galaxy S22 (mediante cable, Google Drive, Quick Share o enlace local).
2. En el S22, abre la app **Mis archivos** de Samsung.
3. Toca sobre `app-debug.apk`. Si el sistema solicita permiso para instalar aplicaciones de fuentes desconocidas, concédeselo para continuar.
4. Pulsa **Instalar**.

---

## 5. Permisos y Ejecución en el S22

Al abrir **CamFinder** por primera vez en el S22:
- La app solicitará permiso de red local (para mDNS / NSD y sockets TCP).
- CamFinder buscará automáticamente el Galaxy A52 en la red Wi-Fi y comenzará la reproducción RTSP con aceleración por hardware mediante AndroidX Media3 ExoPlayer.
- La pantalla permanecerá encendida automáticamente mientras la transmisión esté activa (`FLAG_KEEP_SCREEN_ON`).
