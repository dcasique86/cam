import React from 'react';
import {
  Smartphone,
  Layers,
  Settings,
  RefreshCw,
  Wifi,
  ChevronDown,
} from 'lucide-react';
import { DiscoveredDevice } from '../hooks/useDeviceDiscovery';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  device?: DiscoveredDevice;
  isScanning: boolean;
  onOpenDeviceDrawer: () => void;
  onOpenCameraModal: () => void;
  onOpenDiagnostics: () => void;
  onStartScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  device,
  isScanning,
  onOpenDeviceDrawer,
  onOpenCameraModal,
  onOpenDiagnostics,
  onStartScan,
}) => {
  const activeCam = device?.availableCameras.find((c) => c.id === device.activeCamera);

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">CamFinder</h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PWA Local
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Transmisión de vídeo y audio ambiental por Wi-Fi
            </p>
          </div>
        </div>

        {/* Center: Device & Camera Selector Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDeviceDrawer}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 text-white px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {device?.name || 'Buscando cámara...'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {device && (
            <button
              onClick={onOpenCameraModal}
              className="hidden md:flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-xs font-medium transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[120px]">{activeCam?.name || 'Sensor'}</span>
            </button>
          )}

          <button
            onClick={onStartScan}
            disabled={isScanning}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 text-xs transition cursor-pointer"
            title="Escanear red local ahora"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Right Actions: PWA Install & Diagnostics */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          <button
            onClick={onOpenDiagnostics}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 transition cursor-pointer"
            title="Configuración y Diagnósticos Técnicos"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
