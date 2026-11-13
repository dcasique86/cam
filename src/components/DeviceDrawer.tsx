import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Wifi,
  Search,
  Radio,
  Battery,
  BatteryCharging,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { DiscoveredDevice } from '../hooks/useDeviceDiscovery';

interface DeviceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  devices: DiscoveredDevice[];
  activeDeviceId: string;
  isScanning: boolean;
  onSelectDevice: (id: string) => void;
  onStartScan: () => void;
  onProbeManualIp: (ip: string, port?: number) => void;
}

export const DeviceDrawer: React.FC<DeviceDrawerProps> = ({
  isOpen,
  onClose,
  devices,
  activeDeviceId,
  isScanning,
  onSelectDevice,
  onStartScan,
  onProbeManualIp,
}) => {
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('8554');
  const [showManualForm, setShowManualForm] = useState(false);
  const [probing, setProbing] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) return;
    setProbing(true);
    await onProbeManualIp(manualIp.trim(), parseInt(manualPort) || 8554);
    setProbing(false);
    setShowManualForm(false);
    setManualIp('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-6 overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <span>Cámaras en Red Local</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Descubrimiento ONVIF, mDNS y escaneo TCP
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan & Actions Toolbar */}
        <div className="py-4 flex items-center justify-between gap-2">
          <button
            onClick={onStartScan}
            disabled={isScanning}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isScanning ? 'Buscando en Wi-Fi...' : 'Buscar Cámaras'}</span>
          </button>

          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>IP Manual</span>
          </button>
        </div>

        {/* Manual IP Probe Form */}
        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-2"
          >
            <span className="text-[11px] font-semibold text-slate-300">
              Conexión directa por dirección IP
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="192.168.1.145"
                value={manualIp}
                onChange={(e) => setManualIp(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
              <input
                type="text"
                placeholder="8554"
                value={manualPort}
                onChange={(e) => setManualPort(e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-center font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={probing}
                className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 transition cursor-pointer"
              >
                {probing ? 'Verificando...' : 'Conectar'}
              </button>
            </div>
          </form>
        )}

        {/* Devices List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {devices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No se encontraron dispositivos en la red.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Asegúrate de que AndroidCam esté en ejecución en tu Samsung A52.
              </p>
            </div>
          ) : (
            devices.map((dev) => {
              const isSelected = dev.id === activeDeviceId;
              return (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                      : 'bg-slate-950/50 hover:bg-slate-800/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{dev.name}</h4>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300">
                              Activa
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {dev.ip}:{dev.rtspPort}
                        </p>
                      </div>
                    </div>

                    {/* Signal & Battery */}
                    <div className="flex items-center gap-2">
                      {dev.batteryLevel !== undefined && (
                        <div
                          className="flex items-center gap-1 text-[11px] text-slate-400"
                          title={`Batería: ${dev.batteryLevel}%`}
                        >
                          {dev.batteryCharging ? (
                            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Battery className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{dev.batteryLevel}%</span>
                        </div>
                      )}
                      <div
                        className="flex items-center gap-0.5 text-slate-400"
                        title={`Señal Wi-Fi: ${dev.signalStrength}%`}
                      >
                        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    </div>
                  </div>

                  {/* Device Metadata Badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {dev.model}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                      {dev.discoveryMethod.toUpperCase()}
                    </span>

                    {dev.onvifPort && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                        ONVIF :{dev.onvifPort}
                      </span>
                    )}

                    {dev.androidCamPort && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                        AndroidCam :{dev.androidCamPort}
                      </span>
                    )}
                  </div>

                  {/* Sensor Count */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {dev.availableCameras.length} sensor(es) detectado(s)
                    </span>
                    <span className="text-cyan-400 hover:underline flex items-center gap-1 font-medium">
                      <Eye className="w-3 h-3" /> Ver Transmisión
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            CamFinder opera exclusivamente en la red local. Sin servidores externos ni telemetría.
          </p>
        </div>
      </div>
    </div>
  );
};
