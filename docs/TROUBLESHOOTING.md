# Guía de Solución de Problemas (Troubleshooting)

Este documento contiene soluciones a los problemas más comunes de red local, firewall y reproducción en **CamFinder**.

---

## 1. El emisor (Galaxy A52) no aparece en el descubrimiento automático

### Causa 1: Aislamiento de Clientes en el Router Wi-Fi (AP Isolation)
Muchos routers Wi-Fi modernos vienen con la función "AP Isolation" o "Aislamiento de Clientes" activada por seguridad, lo cual impide que dos dispositivos Wi-Fi se comuniquen entre sí.
- **Solución**:
  1. Entra al panel de configuración de tu router (habitualmente `192.168.1.1` o `192.168.0.1`).
  2. Busca el apartado **Configuración Inalámbrica Avanzada** (Wireless Settings).
  3. Desactiva **AP Isolation** (Aislamiento de punto de acceso).
  4. Si tu router tiene redes separadas para 2.4 GHz y 5 GHz, asegúrate de que ambos teléfonos o la PC estén en la misma banda o que el puente entre bandas esté permitido.

### Causa 2: Dirección IP no estándar o subredes diferentes
- **Solución**:
  En CamFinder (tanto en Windows como en el Galaxy S22), abre el cajón de **Dispositivos**, selecciona **IP Manual** e introduce la dirección IP que muestra la pantalla de AndroidCam en el A52 (por ejemplo `192.168.1.145`) con el puerto `8554`.

---

## 2. Bloqueo de puertos en el Firewall de Windows

Si ejecutas CamFinder Core en Windows y no se reciben respuestas ONVIF o RTSP:
- **Solución**: Permite el tráfico entrante en los puertos necesarios:
  Abre PowerShell como Administrador y ejecuta:
  ```powershell
  # Permitir puerto RTSP
  New-NetFirewallRule -DisplayName "CamFinder RTSP" -Direction Inbound -LocalPort 8554 -Protocol TCP -Action Allow

  # Permitir puerto HTTP de AndroidCam
  New-NetFirewallRule -DisplayName "CamFinder AndroidCam" -Direction Inbound -LocalPort 4444 -Protocol TCP -Action Allow

  # Permitir puerto de servicio CamFinder
  New-NetFirewallRule -DisplayName "CamFinder Web Core" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

  # Permitir descubrimiento ONVIF WS-Discovery (UDP 3702)
  New-NetFirewallRule -DisplayName "CamFinder ONVIF Discovery" -Direction Inbound -LocalPort 3702 -Protocol UDP -Action Allow
  ```

---

## 3. El vídeo se detiene o muestra artefactos verdes/grises

### Causa: Pérdida de paquetes en transporte UDP
- **Solución**:
  - En la aplicación Android (S22), `RtspPlayerManager` viene preconfigurado con `setForceUseRtpTcp(true)`. Esto obliga al protocolo RTSP a viajar encapsulado en TCP (modo Interleaved), eliminando artefactos por pérdida de paquetes UDP.
  - Asegúrate de que la intensidad de la señal Wi-Fi sea superior al 60% en ambos teléfonos.

---

## 4. El audio se escucha con eco o acople

### Causa: El receptor y el emisor están en la misma habitación física
Si estás probando el Galaxy S22 o la computadora Windows al lado del Galaxy A52 emisor, el micrófono del A52 captará el sonido emitido por los altavoces del receptor en un bucle infinito (acople acústico).
- **Solución**:
  - Utiliza auriculares en el dispositivo receptor mientras hagas pruebas en la misma habitación.
  - O pulsa el botón **Silenciar** en la barra de controles de CamFinder. El silencio es local y no interrumpirá el flujo de vídeo.

---

## 5. El sensor de la cámara no cambia al seleccionarlo

### Causa: Restricción de la versión de AndroidCam
Si tu versión de AndroidCam no tiene habilitada la API de control HTTP en el puerto `4444`:
- **Solución**:
  1. En el Samsung Galaxy A52, abre la app AndroidCam directamente.
  2. Pulsa en el icono de cambio de cámara (trasera/frontal/lente) en la propia pantalla del A52.
  3. CamFinder en el S22 y en Windows detectará la reconexión automática en menos de 2 segundos y continuará transmitiendo con el nuevo sensor sin necesidad de reiniciar la app.
