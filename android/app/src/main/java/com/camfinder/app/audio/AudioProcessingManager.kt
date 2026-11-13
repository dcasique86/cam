package com.camfinder.app.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Manages audio focus, safe gain scaling, and peak limiter state on Android.
 */
class AudioProcessingManager(private val context: Context) {

    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    private val _isAgcEnabled = MutableStateFlow(true)
    val isAgcEnabled: StateFlow<Boolean> = _isAgcEnabled.asStateFlow()

    private val _isLimiterActive = MutableStateFlow(false)
    val isLimiterActive: StateFlow<Boolean> = _isLimiterActive.asStateFlow()

    fun requestAudioFocus(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val playbackAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()

            val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener { /* handle ducking */ }
                .build()

            audioManager.requestAudioFocus(focusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        } else {
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            ) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED
        }
    }

    fun toggleAgc() {
        _isAgcEnabled.value = !_isAgcEnabled.value
    }

    /**
     * Maps user gain (1.0x to 4.0x) into safe limiter curve to prevent distortion
     */
    fun calculateEffectiveGain(requestedGain: Float, currentPeakDb: Float): Float {
        val limiterThresholdDb = -6.0f
        return if (currentPeakDb > limiterThresholdDb) {
            _isLimiterActive.value = true
            // Soft knee compression
            val overDb = currentPeakDb - limiterThresholdDb
            val compressedOverDb = overDb / 4.0f
            val targetGainDb = -(overDb - compressedOverDb)
            Math.pow(10.0, (targetGainDb / 20.0)).toFloat() * requestedGain
        } else {
            _isLimiterActive.value = false
            requestedGain
        }
    }
}
