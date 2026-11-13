package com.camfinder.app

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import com.camfinder.app.audio.AudioProcessingManager
import com.camfinder.app.discovery.NsdDiscoveryManager
import com.camfinder.app.model.CameraDevice
import com.camfinder.app.player.RtspPlayerManager
import com.camfinder.app.ui.CamFinderScreen
import com.camfinder.app.ui.theme.CamFinderTheme

class MainActivity : ComponentActivity() {

    private lateinit var playerManager: RtspPlayerManager
    private lateinit var discoveryManager: NsdDiscoveryManager
    private lateinit var audioProcessingManager: AudioProcessingManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen awake while monitoring video/audio
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        playerManager = RtspPlayerManager(this)
        discoveryManager = NsdDiscoveryManager(this)
        audioProcessingManager = AudioProcessingManager(this)

        // Request audio focus for ambient monitoring
        audioProcessingManager.requestAudioFocus()

        // Start local network discovery
        discoveryManager.startDiscovery()

        setContent {
            CamFinderTheme {
                val devices by discoveryManager.devices.collectAsState()
                val isScanning by discoveryManager.isScanning.collectAsState()
                var activeDevice by remember { mutableStateOf<CameraDevice?>(null) }

                // Auto-select first device and play RTSP stream
                LaunchedEffect(devices) {
                    if (activeDevice == null && devices.isNotEmpty()) {
                        val first = devices.first()
                        activeDevice = first
                        playerManager.playRtspStream(first.rtspUrl)
                    }
                }

                CamFinderScreen(
                    playerManager = playerManager,
                    devices = devices,
                    activeDevice = activeDevice,
                    isScanning = isScanning,
                    onSelectDevice = { selected ->
                        activeDevice = selected
                        playerManager.playRtspStream(selected.rtspUrl)
                    },
                    onSelectCamera = { dev, sensor ->
                        activeDevice = dev.copy(
                            activeCameraId = sensor.id,
                            availableCameras = dev.availableCameras.map {
                                it.copy(isCurrent = it.id == sensor.id)
                            }
                        )
                    },
                    onStartScan = {
                        discoveryManager.startDiscovery()
                    }
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        playerManager.release()
        discoveryManager.stopDiscovery()
    }
}
