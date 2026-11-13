package com.camfinder.app.model

enum class DiscoveryType {
    ONVIF,
    MDNS,
    TCP_SCAN,
    MANUAL
}

enum class ConnectionStatus {
    CONNECTING,
    CONNECTED,
    RECONNECTING,
    DISCONNECTED
}

enum class SensorType {
    BACK_MAIN,
    BACK_ULTRA_WIDE,
    BACK_TELEPHOTO,
    BACK_MACRO,
    FRONT_MAIN
}

data class CameraSensor(
    val id: String,
    val name: String,
    val type: SensorType,
    val resolution: String,
    val fov: String? = null,
    val isCurrent: Boolean = false
)

data class CameraDevice(
    val id: String,
    val name: String,
    val model: String,
    val ip: String,
    val rtspPort: Int = 8554,
    val rtspUrl: String = "rtsp://$ip:$rtspPort/live",
    val onvifPort: Int? = 2000,
    val androidCamPort: Int? = 4444,
    val discoveryType: DiscoveryType = DiscoveryType.TCP_SCAN,
    val status: ConnectionStatus = ConnectionStatus.CONNECTED,
    val signalStrength: Int = 90,
    val batteryLevel: Int? = 78,
    val activeCameraId: String = "back_main",
    val availableCameras: List<CameraSensor> = listOf(
        CameraSensor("back_main", "Cámara Trasera Principal (64 MP)", SensorType.BACK_MAIN, "1920x1080 @ 30fps", "81°", true),
        CameraSensor("back_ultra_wide", "Cámara Ultra Gran Angular (12 MP)", SensorType.BACK_ULTRA_WIDE, "1920x1080 @ 30fps", "123°", false),
        CameraSensor("front_main", "Cámara Frontal Selfie (32 MP)", SensorType.FRONT_MAIN, "1920x1080 @ 30fps", "80°", false),
        CameraSensor("back_macro", "Cámara Macro (5 MP)", SensorType.BACK_MACRO, "1280x720 @ 30fps", "85°", false)
    ),
    val canSwitchCameraRemotely: Boolean = true
)
