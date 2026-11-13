import React, { useState } from 'react';
import { useDeviceDiscovery } from './hooks/useDeviceDiscovery';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { AudioActivityBar } from './components/AudioActivityBar';
import { DeviceDrawer } from './components/DeviceDrawer';
import { CameraSelectorModal } from './components/CameraSelectorModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import {
  Wifi,
  Radio,
  Layers,
  Volume2,
  Shield,
  Smartphone,
  Info,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const {
    devices,
    activeDevice,
    activeDeviceId,
    isScanning,
    connectionStatus,
    startScan,
    selectDevice,
    switchCamera,
    probeManualIp,
    refreshDevices,
  } = useDeviceDiscovery();

  const {
    isMuted,
    gainLevel,
    isAgcEnabled,
    isFilterEnabled,
    metrics,
    toggleMute,
    setGain,
    toggleAgc,
    toggleFilter,
  } = useAudioProcessor();

  const [isDeviceDrawerOpen, setIsDeviceDrawerOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const activeCam = activeDevice?.availableCameras.find(
    (c) => c.id === activeDevice.activeCamera
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <Header
        device={activeDevice}
        isScanning={isScanning}
        onOpenDeviceDrawer={() => setIsDeviceDrawerOpen(true)}
        onOpenCameraModal={() => setIsCameraModalOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onStartScan={startScan}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 md:py-6 flex flex-col gap-4">
        {/* Top Quick Status Pill & Sensor Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>{activeDevice?.name || 'Samsung Galaxy A52'}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">
              {activeDevice?.ip || '192.168.1.145'}:{activeDevice?.rtspPort || 8554}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-cyan-300">
              <Layers className="w-3.5 h-3.5" />
              <span>{activeCam?.name || 'Cámara Trasera'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCameraModalOpen(true)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cambiar Sensor</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setIsDeviceDrawerOpen(true)}
              className="text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
            >
              Dispositivos ({devices.length})
            </button>
          </div>
        </div>

        {/* Video Player Viewport */}
        <section className="relative">
          <VideoPlayer
            device={activeDevice}
            connectionStatus={connectionStatus}
            isMuted={isMuted}
            gainLevel={gainLevel}
            onToggleMute={toggleMute}
            onSetGain={setGain}
            onOpenDeviceDrawer={() => setIsDeviceDrawerOpen(true)}
            onOpenCameraModal={() => setIsCameraModalOpen(true)}
            onRefreshFeed={refreshDevices}
          />
        </section>

        {/* Environmental Audio Activity Monitor & AGC Controls */}
        <section>
          <AudioActivityBar
            metrics={metrics}
            isMuted={isMuted}
            gainLevel={gainLevel}
            isAgcEnabled={isAgcEnabled}
            isFilterEnabled={isFilterEnabled}
            onToggleMute={toggleMute}
            onSetGain={setGain}
            onToggleAgc={toggleAgc}
            onToggleFilter={toggleFilter}
          />
        </section>

        {/* Informative Hardware & Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {/* Card 1: Emisor Samsung A52 */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white">Dispositivo Emisor: Galaxy A52</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Configurado con <strong>AndroidCam</strong> transmitiendo RTSP en puerto 8554 con audio
              ambiental activo. Soporta sensor principal de 64MP, ultra gran angular de 123° y frontal
              de 32MP.
            </p>
          </div>

          {/* Card 2: Receptor S22 & Windows PWA */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white">Receptores S22 & Windows PWA</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              En Android (Samsung S22) utiliza <strong>AndroidX Media3 ExoPlayer</strong> nativo. En
              Windows funciona como <strong>PWA instalable</strong> con puente multimedia de baja latencia
              (&lt;60ms).
            </p>
          </div>

          {/* Card 3: Audio Ambiental & Calibración */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white">Audio Ambiental Calibrado</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              El micrófono captura ruidos ambientales y voces lejanas. El limitador de picos previene
              saturación a 0 dBFS mientras el AGC y el filtro de 80Hz limpian zumbidos mecánicos.
            </p>
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <DeviceDrawer
        isOpen={isDeviceDrawerOpen}
        onClose={() => setIsDeviceDrawerOpen(false)}
        devices={devices}
        activeDeviceId={activeDeviceId}
        isScanning={isScanning}
        onSelectDevice={(id) => {
          selectDevice(id);
          setIsDeviceDrawerOpen(false);
        }}
        onStartScan={startScan}
        onProbeManualIp={probeManualIp}
      />

      <CameraSelectorModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        device={activeDevice}
        onSelectCamera={switchCamera}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        activeDeviceId={activeDeviceId}
      />
    </div>
  );
}
