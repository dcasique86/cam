package com.camfinder.app.player

import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.rtsp.RtspMediaSource
import com.camfinder.app.model.ConnectionStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Manages low-latency RTSP playback with AndroidX Media3 ExoPlayer.
 * Configured for instant reconnection, minimal buffering, and ambient audio control.
 */
class RtspPlayerManager(private val context: Context) {

    private var exoPlayer: ExoPlayer? = null
    private var currentUrl: String? = null
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus: StateFlow<ConnectionStatus> = _connectionStatus.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    private val _audioGain = MutableStateFlow(1.5f)
    val audioGain: StateFlow<Float> = _audioGain.asStateFlow()

    private val _audioActivityLevel = MutableStateFlow(32) // 0 - 100
    val audioActivityLevel: StateFlow<Int> = _audioActivityLevel.asStateFlow()

    private var reconnectJob: Job? = null

    fun initializePlayer(): ExoPlayer {
        if (exoPlayer != null) return exoPlayer!!

        // Low latency LoadControl: 100ms min buffer for near real-time local network feed
        val loadControl = DefaultLoadControl.Builder()
            .setBufferDurationsMs(
                /* minBufferMs = */ 100,
                /* maxBufferMs = */ 500,
                /* bufferForPlaybackMs = */ 80,
                /* bufferForPlaybackAfterRebufferMs = */ 150
            )
            .build()

        val player = ExoPlayer.Builder(context)
            .setLoadControl(loadControl)
            .build()

        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                when (state) {
                    Player.STATE_READY -> {
                        _connectionStatus.value = ConnectionStatus.CONNECTED
                        cancelReconnect()
                    }
                    Player.STATE_BUFFERING -> {
                        _connectionStatus.value = ConnectionStatus.RECONNECTING
                    }
                    Player.STATE_ENDED -> {
                        _connectionStatus.value = ConnectionStatus.DISCONNECTED
                        scheduleReconnect()
                    }
                    Player.STATE_IDLE -> {
                        // Waiting or idle
                    }
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                _connectionStatus.value = ConnectionStatus.RECONNECTING
                scheduleReconnect()
            }
        })

        player.volume = if (_isMuted.value) 0f else _audioGain.value.coerceIn(0f, 1f)
        exoPlayer = player
        return player
    }

    fun playRtspStream(rtspUrl: String) {
        currentUrl = rtspUrl
        _connectionStatus.value = ConnectionStatus.CONNECTING

        val player = exoPlayer ?: initializePlayer()

        val mediaItem = MediaItem.Builder()
            .setUri(Uri.parse(rtspUrl))
            .build()

        val rtspMediaSource = RtspMediaSource.Factory()
            .setForceUseRtpTcp(true) // Interleaved TCP for guaranteed packet delivery over local Wi-Fi
            .setTimeoutMs(4000)
            .createMediaSource(mediaItem)

        player.setMediaSource(rtspMediaSource)
        player.prepare()
        player.playWhenReady = true
    }

    fun toggleMute() {
        val newMuted = !_isMuted.value
        _isMuted.value = newMuted
        exoPlayer?.volume = if (newMuted) 0f else _audioGain.value.coerceIn(0f, 1f)
    }

    fun setAudioGain(gain: Float) {
        val clamped = gain.coerceIn(0.5f, 4.0f)
        _audioGain.value = clamped
        if (!_isMuted.value) {
            // Android ExoPlayer volume accepts 0..1, while internal DSP boosts far voices
            exoPlayer?.volume = (clamped / 4.0f).coerceIn(0.1f, 1.0f)
        }
    }

    private fun scheduleReconnect() {
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            delay(2500)
            currentUrl?.let { url ->
                playRtspStream(url)
            }
        }
    }

    private fun cancelReconnect() {
        reconnectJob?.cancel()
        reconnectJob = null
    }

    fun release() {
        cancelReconnect()
        exoPlayer?.release()
        exoPlayer = null
    }
}
