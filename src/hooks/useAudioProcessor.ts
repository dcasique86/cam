import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioMetrics {
  rmsLevel: number; // 0 to 100 percentage
  peakDb: number; // in dBFS (e.g. -45 to 0)
  isClipping: boolean;
  isLimiterEngaged: boolean;
  waveform: number[];
}

export function useAudioProcessor() {
  const [isMuted, setIsMuted] = useState(false);
  const [gainLevel, setGainLevel] = useState(1.5); // 1.0x to 4.0x
  const [isAgcEnabled, setIsAgcEnabled] = useState(true);
  const [isFilterEnabled, setIsFilterEnabled] = useState(true);
  const [metrics, setMetrics] = useState<AudioMetrics>({
    rmsLevel: 25,
    peakDb: -22,
    isClipping: false,
    isLimiterEngaged: false,
    waveform: new Array(16).fill(0),
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const synthSourceRef = useRef<AudioNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Web Audio API pipeline
  const initAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // 1. High-pass filter for soft ambient rumble reduction (80Hz cutoff)
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 80;
      filter.Q.value = 0.7;
      filterRef.current = filter;

      // 2. Main Gain Node (User-controlled 1.0x - 4.0x)
      const gainNode = ctx.createGain();
      gainNode.gain.value = isMuted ? 0 : gainLevel;
      gainNodeRef.current = gainNode;

      // 3. Peak Limiter / Dynamic Compressor
      // Prevents speaker clipping while allowing quiet room voices to be boosted
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -6; // dB
      compressor.knee.value = 12;
      compressor.ratio.value = 16;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      compressorRef.current = compressor;

      // 4. Analyser Node for visual VU meter
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      // Connect pipeline: Filter -> Gain -> Compressor -> Analyser -> Destination
      filter.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(analyser);
      analyser.connect(ctx.destination);

      // Generate realistic ambient background soundscape (subtle air flow + occasional room acoustic resonance)
      // Representing the Samsung A52 room microphone live feed
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink-ish noise filter for natural room tone
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.08; // quiet room base floor
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.connect(filter);
      whiteNoise.start(0);
      synthSourceRef.current = whiteNoise;

      // Start metrics loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const timeDataArray = new Uint8Array(analyser.fftSize);

      const updateLoop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        analyserRef.current.getByteTimeDomainData(timeDataArray);

        // Compute RMS
        let sumSquares = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
          const norm = (timeDataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / timeDataArray.length);
        const rmsPercent = Math.min(100, Math.round(rms * 250));

        // Peak dBFS estimate
        const peak = Math.max(...timeDataArray.map((v) => Math.abs((v - 128) / 128)));
        const peakDb = peak > 0 ? Math.round(20 * Math.log10(peak)) : -60;

        // Downsample waveform to 16 points for UI equalizer
        const waveform = [];
        const step = Math.floor(dataArray.length / 16);
        for (let i = 0; i < 16; i++) {
          waveform.push(dataArray[i * step] / 255);
        }

        const isLimiterEngaged = peakDb > -3;
        const isClipping = peakDb >= -0.5;

        // AGC Adjustments: if enabled and signal is too low for prolonged time, slightly compensate
        if (isAgcEnabled && gainNodeRef.current && !isMuted) {
          if (rmsPercent < 15 && gainLevel < 3.0) {
            // Room is very quiet, slightly raise sensitivity
            gainNodeRef.current.gain.setTargetAtTime(Math.min(3.5, gainLevel * 1.05), ctx.currentTime, 0.1);
          }
        }

        setMetrics({
          rmsLevel: isMuted ? 0 : rmsPercent,
          peakDb: isMuted ? -60 : peakDb,
          isClipping: !isMuted && isClipping,
          isLimiterEngaged: !isMuted && isLimiterEngaged,
          waveform: isMuted ? new Array(16).fill(0) : waveform,
        });

        animFrameRef.current = requestAnimationFrame(updateLoop);
      };

      animFrameRef.current = requestAnimationFrame(updateLoop);
    } catch (err) {
      console.warn('Web Audio initialization error:', err);
    }
  }, [isMuted, gainLevel, isAgcEnabled]);

  // Adjust gain
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : gainLevel;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
    }
  }, [gainLevel, isMuted]);

  // Filter toggle
  useEffect(() => {
    if (filterRef.current) {
      filterRef.current.frequency.value = isFilterEnabled ? 80 : 10;
    }
  }, [isFilterEnabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const toggleMute = () => {
    initAudio();
    setIsMuted((prev) => !prev);
  };

  const setGain = (newGain: number) => {
    initAudio();
    const clamped = Math.max(0.5, Math.min(4.0, newGain));
    setGainLevel(clamped);
  };

  const toggleAgc = () => {
    initAudio();
    setIsAgcEnabled((prev) => !prev);
  };

  const toggleFilter = () => {
    initAudio();
    setIsFilterEnabled((prev) => !prev);
  };

  return {
    isMuted,
    gainLevel,
    isAgcEnabled,
    isFilterEnabled,
    metrics,
    initAudio,
    toggleMute,
    setGain,
    toggleAgc,
    toggleFilter,
  };
}
