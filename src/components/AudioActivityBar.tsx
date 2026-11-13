import React from 'react';
import { Volume2, VolumeX, Shield, Sliders, Waves, Activity } from 'lucide-react';
import { AudioMetrics } from '../hooks/useAudioProcessor';

interface AudioActivityBarProps {
  metrics: AudioMetrics;
  isMuted: boolean;
  gainLevel: number;
  isAgcEnabled: boolean;
  isFilterEnabled: boolean;
  onToggleMute: () => void;
  onSetGain: (gain: number) => void;
  onToggleAgc: () => void;
  onToggleFilter: () => void;
}

export const AudioActivityBar: React.FC<AudioActivityBarProps> = ({
  metrics,
  isMuted,
  gainLevel,
  isAgcEnabled,
  isFilterEnabled,
  onToggleMute,
  onSetGain,
  onToggleAgc,
  onToggleFilter,
}) => {
  // Determine meter color zone
  let barColor = 'bg-cyan-500';
  if (metrics.peakDb > -3) {
    barColor = 'bg-rose-500 animate-pulse';
  } else if (metrics.peakDb > -10) {
    barColor = 'bg-amber-400';
  } else if (metrics.peakDb > -24) {
    barColor = 'bg-emerald-400';
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Audio Status & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMute}
            className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25'
            }`}
            title={isMuted ? 'Activar Audio Ambiental' : 'Silenciar Audio Localmente'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">Audio Ambiental (A52 Mic)</span>
              {isMuted ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-300">
                  Silenciado
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Activo
                </span>
              )}

              {metrics.isLimiterEngaged && !isMuted && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 flex items-center gap-1" title="Limitador de picos activo para evitar saturación">
                  <Shield className="w-2.5 h-2.5" /> Limitador
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Nivel RMS: {isMuted ? '0%' : `${metrics.rmsLevel}%`}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-300">
                Pico: {isMuted ? '-∞' : `${metrics.peakDb} dBFS`}
              </span>
            </p>
          </div>
        </div>

        {/* Center: Real-Time Dynamic VU Level & Waveform Bars */}
        <div className="flex-1 max-w-md flex flex-col justify-center gap-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>-45 dB</span>
            <span>-24 dB</span>
            <span>-12 dB</span>
            <span>-6 dB</span>
            <span className={metrics.isClipping ? 'text-rose-400 font-bold' : ''}>0 dB</span>
          </div>

          {/* Continuous Level Meter with safe zones */}
          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className={`h-full rounded-full transition-all duration-75 ${barColor}`}
              style={{
                width: isMuted ? '0%' : `${Math.min(100, Math.max(3, (metrics.rmsLevel * 1.1)))}%`,
              }}
            />
            {/* Limit mark at -3dB */}
            <div className="absolute top-0 bottom-0 right-[15%] w-0.5 bg-amber-500/50" />
            <div className="absolute top-0 bottom-0 right-[4%] w-0.5 bg-rose-500/70" />
          </div>

          {/* Equalizer Frequency Bars */}
          <div className="flex items-end justify-between h-5 gap-1 px-1">
            {metrics.waveform.map((bar, i) => {
              const height = isMuted ? 15 : Math.max(15, Math.min(100, bar * 100));
              return (
                <div
                  key={i}
                  className={`w-full rounded-sm transition-all duration-75 ${
                    i > 12 && metrics.peakDb > -6 ? 'bg-amber-400' : 'bg-cyan-500/60'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Ambient Gain & Processing Controls */}
        <div className="flex items-center gap-3">
          {/* Ambient Gain Slider */}
          <div className="flex flex-col gap-1 w-28">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-slate-400">
                <Sliders className="w-3 h-3 text-cyan-400" /> Ganancia
              </span>
              <span className="font-mono text-cyan-300 font-medium">{gainLevel.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={gainLevel}
              onChange={(e) => onSetGain(parseFloat(e.target.value))}
              disabled={isMuted}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              title="Ajuste seguro de ganancia (1x a 4x con limitador automático)"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <button
              onClick={onToggleAgc}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                isAgcEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Control Automático de Ganancia: equilibra susurros y sonidos lejanos"
            >
              <Activity className="w-3 h-3" />
              <span>AGC</span>
            </button>

            <button
              onClick={onToggleFilter}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                isFilterEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Filtro pasa-altos 80Hz: reduce ruido de fondo y zumbidos mecánicos"
            >
              <Waves className="w-3 h-3" />
              <span>80Hz</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
