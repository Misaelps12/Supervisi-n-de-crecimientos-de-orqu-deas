// serial-bridge.js
// Lee un puerto serie (Arduino real) y reenvía JSON cada línea a /api/telemetry
// También se conecta por WebSocket a http://localhost:4000 y escribe triggers al serial.

const WebSocket = require('ws');
let SerialPort;
let ReadlineParser;
try {
  const sp = require('serialport');
  SerialPort = sp.SerialPort || sp;
} catch (e) {
  SerialPort = null;
}
try {
  const pr = require('@serialport/parser-readline');
  ReadlineParser = pr.ReadlineParser || pr;
} catch (e) {
  ReadlineParser = null;
}

const fetch = require('node-fetch');

const PORT_NAME = process.env.SERIAL_PORT || 'COM3';
const BAUD = parseInt(process.env.SERIAL_BAUD || '9600', 10);
const SERVER_WS = process.env.SERVER_WS || 'ws://localhost:4000';
const SERVER_HTTP = process.env.SERVER_HTTP || 'http://localhost:4000';

if (!SerialPort || !ReadlineParser) {
  console.error('serialport package not available. Install it with: npm install serialport @serialport/parser-readline');
  process.exit(1);
}

// Create SerialPort in a way compatible with different `serialport` package APIs
let port;
try {
  // If SerialPort is a constructor/function that accepts (path, options)
  if (typeof SerialPort === 'function') {
    port = new SerialPort(PORT_NAME, { baudRate: BAUD, autoOpen: true });
  } else if (SerialPort && typeof SerialPort === 'object') {
    // Some versions export an object with SerialPort class
    const Ctor = SerialPort.SerialPort || SerialPort;
    try {
      port = new Ctor({ path: PORT_NAME, baudRate: BAUD, autoOpen: true });
    } catch (e) {
      // Fallback to function-call style
      port = new Ctor(PORT_NAME, { baudRate: BAUD, autoOpen: true });
    }
  } else {
    throw new Error('Unsupported SerialPort API');
  }
} catch (err) {
  console.error('Failed to create SerialPort:', err && err.message ? err.message : err);
  process.exit(1);
}

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', async (line) => {
  line = line.toString().trim();
  try {
    const data = JSON.parse(line);
    console.log('[SERIAL -> ]', data);
    // Reenviar al backend
    await fetch(`${SERVER_HTTP}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, time: data.time || Date.now() }),
    });
  } catch (err) {
    console.warn('Ignored serial line (not JSON):', line);
  }
});

// Web Socket para recibir triggers y enviarlos al serial
const ws = new WebSocket(SERVER_WS);
ws.on('open', () => console.log('WS bridge connected to', SERVER_WS));
ws.on('error', (err) => console.error('WS error:', err.message));
ws.on('message', (msg) => {
  try {
    const m = JSON.parse(msg);
    if (m.type === 'raw' && m.payload && typeof m.payload.text === 'string') {
      // escribir el texto tal cual fue solicitado (útil para Arduino/Tinkercad)
      const out = m.payload.text;
      console.log('[-> SERIAL raw]', out);
      port.write(out + '\n');
    } else if (m.type === 'trigger' || m.type === 'program_saved' || m.type === 'program_deleted') {
      // escribir la señal al serial como JSON
      const out = JSON.stringify(m);
      console.log('[-> SERIAL]', out);
      port.write(out + '\n');
    }
  } catch (err) {
    
  }
});

port.on('open', () => console.log(`Serial port ${PORT_NAME} open @${BAUD}`));
port.on('error', (err) => console.error('Serial port error:', err.message));
