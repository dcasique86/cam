# Add project specific ProGuard rules here.
# Keep AndroidX Media3 RTSP and Compose classes intact
-keep class androidx.media3.exoplayer.rtsp.** { *; }
-keep class com.camfinder.app.model.** { *; }
