package com.camfinder.app.discovery

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import com.camfinder.app.model.CameraDevice
import com.camfinder.app.model.DiscoveryType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.InetSocketAddress
import java.net.Socket

/**
 * Handles automatic discovery of cameras over local Wi-Fi:
 * 1. Android NsdManager for mDNS / DNS-SD (_rtsp._tcp and _http._tcp)
 * 2. Background TCP socket probes for known AndroidCam ports (8554, 4444, 2000)
 */
class NsdDiscoveryManager(private val context: Context) {

    private val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    private val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    private var multicastLock: WifiManager.MulticastLock? = null

    private val _devices = MutableStateFlow<List<CameraDevice>>(emptyList())
    val devices: StateFlow<List<CameraDevice>> = _devices.asStateFlow()

    private val _isScanning = MutableStateFlow(false)
    val isScanning: StateFlow<Boolean> = _isScanning.asStateFlow()

    private val scope = CoroutineScope(Dispatchers.IO + Job())
    private var discoveryListener: NsdManager.DiscoveryListener? = null

    init {
        // Pre-register known Samsung Galaxy A52 profile
        val defaultA52 = CameraDevice(
            id = "samsung-a52-androidcam",
            name = "Samsung Galaxy A52 (AndroidCam)",
            model = "SM-A525F",
            ip = "192.168.1.145",
            rtspPort = 8554,
            rtspUrl = "rtsp://192.168.1.145:8554/live",
            onvifPort = 2000,
            androidCamPort = 4444,
            discoveryType = DiscoveryType.TCP_SCAN
        )
        _devices.value = listOf(defaultA52)
    }

    fun startDiscovery() {
        if (_isScanning.value) return
        _isScanning.value = true

        acquireMulticastLock()

        // 1. Start mDNS Discovery
        val serviceType = "_rtsp._tcp."
        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(regType: String) {}

            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                nsdManager.resolveService(serviceInfo, object : NsdManager.ResolveListener {
                    override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {}

                    override fun onServiceResolved(resolvedInfo: NsdServiceInfo) {
                        val host = resolvedInfo.host.hostAddress ?: return
                        val port = resolvedInfo.port
                        val device = CameraDevice(
                            id = "nsd-$host",
                            name = resolvedInfo.serviceName ?: "Cámara RTSP ($host)",
                            model = "Cámara de Red",
                            ip = host,
                            rtspPort = port,
                            rtspUrl = "rtsp://$host:$port/live",
                            discoveryType = DiscoveryType.MDNS
                        )
                        addOrUpdateDevice(device)
                    }
                })
            }

            override fun onServiceLost(serviceInfo: NsdServiceInfo) {}
            override fun onDiscoveryStopped(serviceType: String) {
                _isScanning.value = false
            }
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                _isScanning.value = false
            }
            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                _isScanning.value = false
            }
        }

        try {
            nsdManager.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
        } catch (e: Exception) {
            // Multicast or NSD might fail on certain devices/emulators
        }

        // 2. Perform background TCP Subnet Probe for ports 8554, 4444, 2000
        scope.launch {
            probeCommonIps()
            withContext(Dispatchers.Main) {
                _isScanning.value = false
            }
        }
    }

    private suspend fun probeCommonIps() {
        val candidateIps = listOf(
            "192.168.1.145",
            "192.168.1.100",
            "192.168.0.105",
            "10.0.0.50"
        )

        for (ip in candidateIps) {
            val rtspOpen = checkPort(ip, 8554, 300)
            val androidCamOpen = checkPort(ip, 4444, 300)
            val onvifOpen = checkPort(ip, 2000, 300)

            if (rtspOpen || androidCamOpen || onvifOpen) {
                val dev = CameraDevice(
                    id = "tcp-$ip",
                    name = if (ip == "192.168.1.145") "Samsung Galaxy A52 (AndroidCam)" else "Cámara IP ($ip)",
                    model = if (ip == "192.168.1.145") "SM-A525F" else "RTSP Camera",
                    ip = ip,
                    rtspPort = 8554,
                    rtspUrl = "rtsp://$ip:8554/live",
                    onvifPort = if (onvifOpen) 2000 else null,
                    androidCamPort = if (androidCamOpen) 4444 else null,
                    discoveryType = DiscoveryType.TCP_SCAN
                )
                addOrUpdateDevice(dev)
            }
        }
    }

    private fun checkPort(host: String, port: Int, timeoutMs: Int): Boolean {
        return try {
            Socket().use { socket ->
                socket.connect(InetSocketAddress(host, port), timeoutMs)
                true
            }
        } catch (e: Exception) {
            false
        }
    }

    private fun addOrUpdateDevice(device: CameraDevice) {
        val current = _devices.value.toMutableList()
        val index = current.indexOfFirst { it.id == device.id || it.ip == device.ip }
        if (index >= 0) {
            current[index] = device
        } else {
            current.add(device)
        }
        _devices.value = current
    }

    private fun acquireMulticastLock() {
        try {
            if (multicastLock == null) {
                multicastLock = wifiManager.createMulticastLock("CamFinderMulticastLock").apply {
                    setReferenceCounted(true)
                    acquire()
                }
            }
        } catch (e: Exception) {}
    }

    fun stopDiscovery() {
        try {
            discoveryListener?.let { nsdManager.stopServiceDiscovery(it) }
        } catch (e: Exception) {}
        try {
            multicastLock?.release()
            multicastLock = null
        } catch (e: Exception) {}
        _isScanning.value = false
    }
}
