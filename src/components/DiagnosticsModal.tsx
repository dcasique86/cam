import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  ShieldCheck,
  Server,
  Activity,
  Cpu,
  Radio,
  Sliders,
  CheckCircle,
} from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDeviceId: string;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  activeDeviceId,
}) => {
  const [coreStatus, setCoreStatus] = useState<any>(null);
  const [lowLatencyBuffer, setLowLatencyBuffer] = useState(true);
  const [autoReconnectInterval, setAutoReconnectInterval] = useState(3);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/status')
        .then((res) => res.json())
        .then((data) => setCoreStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>Configuración y Diagnósticos Técnicos</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Estado de red, protocolos multimedia y privacidad local
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="my-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          {/* Security & Privacy Commitment */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-300">100% Red Local y Privada</h4>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                CamFinder no contiene telemetría, no realiza llamadas a la nube, no transmite audio ni
                vídeo a servidores externos y no almacena grabaciones sin tu consentimiento explícito.
              </p>
            </div>
          </div>

          {/* Core Service Info */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-white flex items-center gap-1.5 mb-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Servicio CamFinder Core (Windows / Local)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
              <div>
                <span className="text-slate-500">Estado:</span>{' '}
                <span className="text-emerald-400 font-mono">En ejecución</span>
              </div>
              <div>
                <span className="text-slate-500">Plataforma:</span>{' '}
                <span className="font-mono">{coreStatus?.platform || 'node.js / win32'}</span>
              </div>
              <div>
                <span className="text-slate-500">Puerto RTSP:</span>{' '}
                <span className="font-mono text-cyan-300">8554 (TCP/UDP)</span>
              </div>
              <div>
                <span className="text-slate-500">Puerto ONVIF:</span>{' '}
                <span className="font-mono text-cyan-300">2000 (WS-Discovery)</span>
              </div>
              <div>
                <span className="text-slate-500">Puerto AndroidCam:</span>{' '}
                <span className="font-mono text-cyan-300">4444 (Panel HTTP)</span>
              </div>
              <div>
                <span className="text-slate-500">Subredes:</span>{' '}
                <span className="font-mono">{coreStatus?.subnets?.join(', ') || '192.168.1.x'}</span>
              </div>
            </div>
          </div>

          {/* Media Engine Settings */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-white flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Ajustes de Baja Latencia y Búfer</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-200">Modo Ultra Baja Latencia</div>
                  <div className="text-[10px] text-slate-400">
                    Minimiza el búfer de reproducción a menos de 60ms
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={lowLatencyBuffer}
                  onChange={(e) => setLowLatencyBuffer(e.target.checked)}
                  className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-200">Intervalo de Reconexión Automática</div>
                  <div className="text-[10px] text-slate-400">
                    Tiempo de espera ante caídas momentáneas de señal Wi-Fi
                  </div>
                </div>
                <select
                  value={autoReconnectInterval}
                  onChange={(e) => setAutoReconnectInterval(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                >
                  <option value={2}>2 segundos</option>
                  <option value={3}>3 segundos</option>
                  <option value={5}>5 segundos</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
