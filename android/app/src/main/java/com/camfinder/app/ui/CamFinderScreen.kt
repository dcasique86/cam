package com.camfinder.app.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.ui.PlayerView
import com.camfinder.app.model.CameraDevice
import com.camfinder.app.model.CameraSensor
import com.camfinder.app.model.ConnectionStatus
import com.camfinder.app.player.RtspPlayerManager
import com.camfinder.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CamFinderScreen(
    playerManager: RtspPlayerManager,
    devices: List<CameraDevice>,
    activeDevice: CameraDevice?,
    isScanning: Boolean,
    onSelectDevice: (CameraDevice) -> Unit,
    onSelectCamera: (CameraDevice, CameraSensor) -> Unit,
    onStartScan: () -> Unit
) {
    val context = LocalContext.current
    val connectionStatus by playerManager.connectionStatus.collectAsState()
    val isMuted by playerManager.isMuted.collectAsState()
    val audioGain by playerManager.audioGain.collectAsState()
    val audioLevel by playerManager.audioActivityLevel.collectAsState()

    var showDeviceSheet by remember { mutableStateOf(false) }
    var showCameraSheet by remember { mutableStateOf(false) }
    var showSettingsSheet by remember { mutableStateOf(false) }
    var isControlsVisible by remember { mutableStateOf(true) }
    var isFullscreen by remember { mutableStateOf(false) }

    val activeCam = activeDevice?.availableCameras?.find { it.id == activeDevice.activeCameraId }

    Scaffold(
        containerColor = BgDark,
        topBar = {
            if (!isFullscreen) {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = SurfaceDark.copy(alpha = 0.95f),
                        titleContentColor = TextPrimary
                    ),
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(CyanAccent),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Videocam,
                                    contentDescription = null,
                                    tint = BgDark,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "CamFinder",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = activeDevice?.name ?: "Buscando cámara...",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = CyanAccent
                                )
                            }
                        }
                    },
                    actions = {
                        IconButton(onClick = { isFullscreen = true }) {
                            Icon(
                                imageVector = Icons.Default.Fullscreen,
                                contentDescription = "Pantalla Completa",
                                tint = CyanAccent
                            )
                        }
                        IconButton(onClick = onStartScan) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Buscar Cámaras",
                                tint = if (isScanning) CyanAccent else TextSecondary
                            )
                        }
                        IconButton(onClick = { showDeviceSheet = true }) {
                            Icon(
                                imageVector = Icons.Default.Devices,
                                contentDescription = "Dispositivos",
                                tint = TextSecondary
                            )
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Video Player Box with AndroidView
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(Color.Black)
                    .clickable { isControlsVisible = !isControlsVisible }
            ) {
                // ExoPlayer Viewport
                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { ctx ->
                        PlayerView(ctx).apply {
                            player = playerManager.initializePlayer()
                            useController = false // Custom minimal Compose controls
                        }
                    }
                )

                // Status & Telemetry HUD Overlay
                AnimatedVisibility(
                    visible = isControlsVisible,
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.Black.copy(alpha = 0.6f))
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Connection Pill
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (connectionStatus) {
                                            ConnectionStatus.CONNECTED -> EmeraldLive
                                            ConnectionStatus.RECONNECTING -> AmberWarning
                                            else -> RoseClipping
                                        }
                                    )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = when (connectionStatus) {
                                    ConnectionStatus.CONNECTED -> "EN DIRECTO"
                                    ConnectionStatus.RECONNECTING -> "RECONECTANDO..."
                                    else -> "CONECTANDO..."
                                },
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Active Sensor Shortcut
                            activeCam?.let { cam ->
                                Button(
                                    onClick = { showCameraSheet = true },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = SurfaceLighter.copy(alpha = 0.8f)
                                    ),
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = null,
                                        tint = CyanAccent,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = cam.name,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextPrimary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            IconButton(
                                onClick = { isFullscreen = !isFullscreen },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = if (isFullscreen) Icons.Default.FullscreenExit else Icons.Default.Fullscreen,
                                    contentDescription = if (isFullscreen) "Salir de Pantalla Completa" else "Pantalla Completa",
                                    tint = CyanAccent
                                )
                            }
                        }
                    }
                }

                // Floating Action Controls inside Video Box when in Fullscreen
                if (isFullscreen && isControlsVisible) {
                    Row(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        IconButton(
                            onClick = { playerManager.toggleMute() },
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(SurfaceDark.copy(alpha = 0.85f))
                        ) {
                            Icon(
                                imageVector = if (isMuted) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                                contentDescription = "Silenciar",
                                tint = if (isMuted) RoseClipping else CyanAccent
                            )
                        }
                        IconButton(
                            onClick = { isFullscreen = false },
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(CyanAccent)
                        ) {
                            Icon(
                                imageVector = Icons.Default.FullscreenExit,
                                contentDescription = "Salir de Pantalla Completa",
                                tint = BgDark
                            )
                        }
                    }
                }

                // Reconnecting Centered Banner
                if (connectionStatus != ConnectionStatus.CONNECTED) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.7f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            CircularProgressIndicator(color = CyanAccent, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Enlazando flujo RTSP con ${activeDevice?.name ?: "Galaxy A52"}...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary
                            )
                        }
                    }
                }
            }

            // Bottom Audio Activity & Controls Bar (visible when not fullscreen)
            if (!isFullscreen) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = SurfaceDark,
                    tonalElevation = 8.dp
                ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    // Audio Level Meter Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (isMuted) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                                contentDescription = null,
                                tint = if (isMuted) RoseClipping else CyanAccent,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Audio Ambiental (A52 Mic)",
                                style = MaterialTheme.typography.titleMedium,
                                fontSize = 14.sp
                            )
                        }

                        Text(
                            text = if (isMuted) "SILENCIADO" else "${audioLevel}% RMS",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isMuted) RoseClipping else EmeraldLive
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Real-time VU Progress Bar
                    val animatedLevel by animateFloatAsState(
                        targetValue = if (isMuted) 0f else (audioLevel / 100f).coerceIn(0f, 1f),
                        label = "audio_level"
                    )
                    LinearProgressIndicator(
                        progress = { animatedLevel },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = if (audioLevel > 80) RoseClipping else if (audioLevel > 60) AmberWarning else CyanAccent,
                        trackColor = SurfaceLighter
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Ambient Gain Slider & Mute Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = { playerManager.toggleMute() },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isMuted) RoseClipping.copy(alpha = 0.2f) else SurfaceLighter)
                        ) {
                            Icon(
                                imageVector = if (isMuted) Icons.Default.VolumeOff else Icons.Default.VolumeUp,
                                contentDescription = "Silenciar",
                                tint = if (isMuted) RoseClipping else TextPrimary
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Ganancia Ambiental",
                                    style = MaterialTheme.typography.labelSmall
                                )
                                Text(
                                    text = "${String.format("%.1f", audioGain)}x (Limitador Activo)",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = CyanAccent
                                )
                            }
                            Slider(
                                value = audioGain,
                                onValueChange = { playerManager.setAudioGain(it) },
                                valueRange = 0.5f..4.0f,
                                colors = SliderDefaults.colors(
                                    thumbColor = CyanAccent,
                                    activeTrackColor = CyanAccent,
                                    inactiveTrackColor = SurfaceLighter
                                ),
                                enabled = !isMuted
                            )
                        }
                    }
                }
            }
        }
        }
    }

    // Device Selector Bottom Sheet
    if (showDeviceSheet) {
        ModalBottomSheet(
            onDismissRequest = { showDeviceSheet = false },
            containerColor = SurfaceDark
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Dispositivos en Red Wi-Fi",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(8.dp))
                LazyColumn(modifier = Modifier.fillMaxWidth()) {
                    items(devices) { dev ->
                        val isSelected = dev.id == activeDevice?.id
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable {
                                    onSelectDevice(dev)
                                    showDeviceSheet = false
                                },
                            colors = CardDefaults.cardColors(
                                containerColor = if (isSelected) CyanAccent.copy(alpha = 0.15f) else SurfaceLighter
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = dev.name,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontSize = 14.sp
                                    )
                                    Text(
                                        text = "${dev.ip}:${dev.rtspPort} • ${dev.model}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextSecondary
                                    )
                                }
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = CyanAccent
                                    )
                                }
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    // Camera Sensor Bottom Sheet
    if (showCameraSheet && activeDevice != null) {
        ModalBottomSheet(
            onDismissRequest = { showCameraSheet = false },
            containerColor = SurfaceDark
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Seleccionar Sensor de Cámara (A52)",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Samsung A52 dispone de 4 sensores traseros y frontal.",
                    style = MaterialTheme.typography.labelSmall
                )
                Spacer(modifier = Modifier.height(12.dp))

                activeDevice.availableCameras.forEach { cam ->
                    val isCurrent = cam.id == activeDevice.activeCameraId
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clickable {
                                onSelectCamera(activeDevice, cam)
                                showCameraSheet = false
                            },
                        colors = CardDefaults.cardColors(
                            containerColor = if (isCurrent) CyanAccent.copy(alpha = 0.15f) else SurfaceLighter
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = cam.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = "${cam.resolution} ${cam.fov?.let { "• FOV: $it" } ?: ""}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextSecondary
                                )
                            }
                            if (isCurrent) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = CyanAccent
                                )
                            }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
