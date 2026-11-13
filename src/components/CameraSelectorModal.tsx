import React, { useState } from 'react';
import {
  X,
  Camera,
  Check,
  AlertCircle,
  Eye,
  Info,
  Maximize,
  Sparkles,
} from 'lucide-react';
import { DiscoveredDevice, CameraSensor } from '../hooks/useDeviceDiscovery';

interface CameraSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: DiscoveredDevice;
  onSelectCamera: (deviceId: string, cameraId: string) => Promise<{ success: boolean; note?: string } | null>;
}

export const CameraSelectorModal: React.FC<CameraSelectorModalProps> = ({
  isOpen,
  onClose,
  device,
  onSelectCamera,
}) => {
  const [switching, setSwitching] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);

  if (!isOpen || !device) return null;

  const handleSelect = async (camera: CameraSensor) => {
    setSwitching(true);
    setFeedbackNote(null);
    const res = await onSelectCamera(device.id, camera.id);
    setSwitching(false);
    if (res && res.note) {
      setFeedbackNote(res.note);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" />
              <span>Selección de Sensor de Cámara</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Dispositivo: {device.name} ({device.model})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical Notice Banner */}
        <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Arquitectura de Sensores del A52:</span> El
            Samsung Galaxy A52 cuenta con 4 cámaras traseras y 1 frontal. El cambio se comunica a
            través del endpoint de control HTTP de AndroidCam en el puerto 4444. El protocolo RTSP
            estándar (puerto 8554) transmite el flujo de vídeo codificado del sensor activo.
          </div>
        </div>

        {/* Status Feedback Note */}
        {feedbackNote && (
          <div className="mb-4 p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/30 text-xs text-cyan-200">
            {feedbackNote}
          </div>
        )}

        {/* Camera List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {device.availableCameras.map((camera) => {
            const isCurrent = camera.id === device.activeCamera;
            return (
              <div
                key={camera.id}
                onClick={() => handleSelect(camera)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isCurrent
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isCurrent ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{camera.name}</h4>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300">
                          En Transmisión
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{camera.resolution}</span>
                      {camera.fov && (
                        <>
                          <span>•</span>
                          <span>Campo de visión: {camera.fov}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <button
                      disabled={switching}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
