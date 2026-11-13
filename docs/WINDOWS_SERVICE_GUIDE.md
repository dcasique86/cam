# Guía de Instalación: CamFinder Core y PWA en Windows

Esta guía detalla cómo instalar y configurar **CamFinder** en una computadora con Windows 10 u 11, tanto el servicio en segundo plano (**CamFinder Core**) como la aplicación web instalable (**PWA**).

---

## 1. Instalación del Servicio Local (CamFinder Core)

**CamFinder Core** es el motor que ejecuta el descubrimiento ONVIF, la sonda mDNS, el escaneo TCP y el puente RTSP de baja latencia.

### Paso 1: Instalación de Node.js
Si aún no dispones de Node.js en Windows:
1. Descarga el instalador LTS de [Node.js](https://nodejs.org) (versión 18 o superior).
2. Ejecuta el instalador marcando la casilla de agregar a las variables de entorno `PATH`.

### Paso 2: Instalación de Dependencias
Abre **Windows Terminal** o **PowerShell** en la carpeta del proyecto y ejecuta:
```powershell
npm install
```

### Paso 3: Iniciar en Modo Normal
Para ejecutar el servicio mientras uses la computadora:
```powershell
npm run dev
```
El servicio estará disponible en `http://localhost:3000`.

---

## 2. Ejecutar CamFinder Core como Servicio Automático de Windows

Si deseas que CamFinder Core se inicie automáticamente al encender la PC sin necesidad de abrir una consola:

### Opción A: Mediante PM2 (Recomendado)
```powershell
# 1. Instalar PM2 globalmente
npm install -g pm2 pm2-windows-service

# 2. Configurar el servicio
pm2-service-install

# 3. Iniciar CamFinder Core
pm2 start server.ts --name "camfinder-core" --interpreter tsx

# 4. Guardar configuración persistente
pm2 save
```

### Opción B: Mediante NSSM (Non-Sucking Service Manager)
1. Descarga `nssm.exe` desde [nssm.cc](https://nssm.cc/).
2. Abre PowerShell como Administrador y ejecuta:
   ```powershell
   nssm install CamFinderCore "C:\Program Files\nodejs\node.exe" "C:\Ruta\CamFinder\server.ts"
   nssm start CamFinderCore
   ```

---

## 3. Instalación de la Aplicación Web (PWA) en Windows

Una vez que CamFinder Core está activo:

1. Abre **Google Chrome** o **Microsoft Edge**.
2. Ingresa a `http://localhost:3000`.
3. Verás un botón en la barra superior llamado **"Instalar App"** con el icono de descarga.
4. Alternativamente, en la barra de direcciones del navegador:
   - En **Microsoft Edge**: Haz clic en el icono de **"Aplicación disponible. Instalar CamFinder"** (icono con tres cuadrados y un más).
   - En **Google Chrome**: Haz clic en el icono de **"Instalar CamFinder"** a la derecha de la barra de direcciones.
5. Confirma la instalación.

### Ventajas de la PWA en Windows
- **Ventana Independiente**: Sin barras de navegación, botones de recarga ni distracciones del navegador.
- **Icono en Menú Inicio y Barra de Tareas**: Puedes anclar CamFinder para abrirlo con un clic.
- **Aceleración Gráfica Directa**: Procesamiento por hardware para vídeo de baja latencia (<60ms) y Web Audio API.
- **Funcionamiento Offline**: La interfaz se almacena en caché local y no depende de acceso a Internet.
