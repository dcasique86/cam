import { useState, useEffect, useCallback, useRef } from 'react';

export interface CameraSensor {
  id: string;
  name: string;
  type: 'back_main' | 'back_ultra_wide' | 'back_telephoto' | 'back_macro' | 'front_main';
  resolution: string;
  fov?: string;
  isCurrent: boolean;
}

export interface DiscoveredDevice {
  id: string;
  ip: string;
  name: string;
  model: string;
  manufacturer: string;
  rtspPort: number;
  rtspUrl: string;
  onvifPort?: number;
  androidCamPort?: number;
  discoveryMethod: 'onvif' | 'mdns' | 'tcp_scan' | 'manual';
  status: 'online' | 'streaming' | 'offline';
  lastSeen: number;
  signalStrength: number;
  activeCamera: string;
  availableCameras: CameraSensor[];
  batteryLevel?: number;
  batteryCharging?: boolean;
  canSwitchCameraRemotely: boolean;
  notes?: string;
}

export function useDeviceDiscovery() {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');
  const [lastError, setLastError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
        if (data.activeDeviceId) {
          setActiveDeviceId(data.activeDeviceId);
        }
      }
    } catch (err) {
      console.warn('Error fetching devices:', err);
    }
  }, []);

  // WebSocket connection for real-time events
  const connectWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setConnectionStatus('connected');
        setLastError(null);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'scan_started') {
            setIsScanning(true);
          } else if (msg.type === 'scan_completed') {
            setIsScanning(false);
            if (msg.devices) setDevices(msg.devices);
          } else if (msg.type === 'device_discovered') {
            setDevices((prev) => {
              const exists = prev.find((d) => d.id === msg.device.id);
              if (exists) {
                return prev.map((d) => (d.id === msg.device.id ? msg.device : d));
              }
              return [...prev, msg.device];
            });
          } else if (msg.type === 'active_device_changed') {
            setActiveDeviceId(msg.deviceId);
          } else if (msg.type === 'camera_switched') {
            setDevices((prev) =>
              prev.map((dev) => {
                if (dev.id === msg.deviceId) {
                  return {
                    ...dev,
                    activeCamera: msg.cameraId,
                    availableCameras: dev.availableCameras.map((c) => ({
                      ...c,
                      isCurrent: c.id === msg.cameraId,
                    })),
                  };
                }
                return dev;
              })
            );
          }
        } catch (e) {
          console.warn('WS message parse error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setConnectionStatus('reconnecting');
        // Auto-reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 3000);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch {
      // WS fallback to polling
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    connectWs();

    // Polling fallback every 8 seconds
    const interval = setInterval(fetchDevices, 8000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchDevices, connectWs]);

  // Trigger discovery scan
  const startScan = async () => {
    setIsScanning(true);
    setLastError(null);
    try {
      const res = await fetch('/api/discover');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err: unknown) {
      setLastError(err instanceof Error ? err.message : 'Error durante el escaneo');
    } finally {
      setIsScanning(false);
    }
  };

  // Select active device
  const selectDevice = async (id: string) => {
    try {
      const res = await fetch('/api/devices/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setActiveDeviceId(id);
      }
    } catch (err: unknown) {
      setLastError(err instanceof Error ? err.message : 'Error al seleccionar cámara');
    }
  };

  // Switch camera sensor
  const switchCamera = async (deviceId: string, cameraId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/camera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state immediately
        setDevices((prev) =>
          prev.map((d) => (d.id === deviceId ? data.device : d))
        );
        return data;
      }
    } catch (err: unknown) {
      setLastError(err instanceof Error ? err.message : 'Error al cambiar sensor');
    }
    return null;
  };

  // Manual IP probe
  const probeManualIp = async (ip: string, port = 8554) => {
    try {
      const res = await fetch('/api/devices/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.device) {
          setDevices((prev) => {
            const filtered = prev.filter((d) => d.id !== data.device.id);
            return [...filtered, data.device];
          });
          setActiveDeviceId(data.device.id);
        }
        return data;
      }
    } catch (err: unknown) {
      setLastError(err instanceof Error ? err.message : 'Error al sondear IP');
    }
    return null;
  };

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];

  return {
    devices,
    activeDevice,
    activeDeviceId,
    isScanning,
    connectionStatus,
    wsConnected,
    lastError,
    startScan,
    selectDevice,
    switchCamera,
    probeManualIp,
    refreshDevices: fetchDevices,
  };
}
