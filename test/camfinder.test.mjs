import test from 'node:test';
import assert from 'node:assert/strict';

test('1. Descubrimiento: Estructura de sonda SOAP ONVIF WS-Discovery', () => {
  const probeUuid = 'uuid-test-12345';
  const onvifProbe = `<?xml version="1.0" encoding="utf-8"?>
<e:Envelope xmlns:e="http://www.w3.org/2003/05/soap-envelope"
  xmlns:w="http://schemas.xmlsoap.org/ws/2004/08/addressing"
  xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery"
  xmlns:dn="http://www.onvif.org/ver10/network/wsdl">
  <e:Header>
    <w:MessageID>${probeUuid}</w:MessageID>
    <w:To>urn:schemas-xmlsoap-org:ws:2005:04:discovery</w:To>
    <w:Action>http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</w:Action>
  </e:Header>
  <e:Body>
    <d:Probe>
      <d:Types>dn:NetworkVideoTransmitter</d:Types>
    </d:Probe>
  </e:Body>
</e:Envelope>`;

  assert.ok(onvifProbe.includes('NetworkVideoTransmitter'), 'Debe incluir el tipo ONVIF de transmisor de vídeo');
  assert.ok(onvifProbe.includes(probeUuid), 'Debe contener el MessageID único para correlación');
});

test('2. Conexión RTSP: Validación y construcción de URL para Galaxy A52', () => {
  function buildRtspUrl(ip, port = 8554, route = '/live') {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    return `rtsp://${ip}:${port}${cleanRoute}`;
  }

  const url = buildRtspUrl('192.168.1.145', 8554, 'live');
  assert.equal(url, 'rtsp://192.168.1.145:8554/live');

  // Validar formato de URL
  const parsed = new URL(url.replace('rtsp://', 'http://'));
  assert.equal(parsed.hostname, '192.168.1.145');
  assert.equal(parsed.port, '8554');
  assert.equal(parsed.pathname, '/live');
});

test('3. Audio Ambiental: Algoritmo AGC y Limitador de Picos a -0.5 dBFS', () => {
  // Función matemática de limitación emulando DynamicCompressorNode
  function applyPeakLimiter(inputDb, thresholdDb = -6.0, ratio = 16.0) {
    if (inputDb <= thresholdDb) {
      return inputDb;
    }
    const excess = inputDb - thresholdDb;
    const compressed = thresholdDb + excess / ratio;
    // Hard ceiling clamp a -0.5 dBFS para evitar cualquier distorsión o clipping en altavoces
    return Math.min(-0.5, compressed);
  }

  // Sonido ambiental silencioso (-24 dB): no debe comprimirse
  assert.equal(applyPeakLimiter(-24), -24);

  // Voz normal (-10 dB): no debe comprimirse
  assert.equal(applyPeakLimiter(-10), -10);

  // Grito o portazo fuerte (+4 dB): debe ser comprimido por debajo de -0.5 dB
  const limited = applyPeakLimiter(4);
  assert.ok(limited <= -0.5, `Pico saturado debe comprimirse por debajo del techo (-0.5 dB), resultado: ${limited}`);
});

test('4. Sensores: Mapeo y selección de cámaras físicas del Samsung Galaxy A52', () => {
  const a52Sensors = [
    { id: 'back_main', name: 'Cámara Trasera Principal (64 MP)', fov: '81°' },
    { id: 'back_ultra_wide', name: 'Cámara Ultra Gran Angular (12 MP)', fov: '123°' },
    { id: 'front_main', name: 'Cámara Frontal Selfie (32 MP)', fov: '80°' },
    { id: 'back_macro', name: 'Cámara Macro (5 MP)', fov: '85°' },
  ];

  assert.equal(a52Sensors.length, 4, 'Samsung A52 debe exponer los sensores clave');
  const ultraWide = a52Sensors.find(s => s.id === 'back_ultra_wide');
  assert.ok(ultraWide, 'Debe incluir sensor ultra gran angular');
  assert.equal(ultraWide.fov, '123°', 'El campo de visión ultra ancho debe ser de 123°');
});

test('5. Red Local: Detección y filtrado de subredes privadas sin acceso a Internet', () => {
  function isPrivateLocalSubnet(ip) {
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.')) return true;
    if (ip.startsWith('172.')) {
      const secondOctet = parseInt(ip.split('.')[1], 10);
      return secondOctet >= 16 && secondOctet <= 31;
    }
    return false;
  }

  assert.ok(isPrivateLocalSubnet('192.168.1.145'));
  assert.ok(isPrivateLocalSubnet('10.0.0.12'));
  assert.ok(isPrivateLocalSubnet('127.0.0.1'));
  assert.ok(!isPrivateLocalSubnet('8.8.8.8'), 'Servidores públicos de Internet deben ser rechazados');
  assert.ok(!isPrivateLocalSubnet('142.250.190.46'), 'IPs públicas de Google deben ser rechazadas');
});
