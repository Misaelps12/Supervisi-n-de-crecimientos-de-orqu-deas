// simulate-tinkercad.js
// Simula un sensor (como en Tinkercad) que envía telemetría periódica al backend
// y escucha triggers vía WebSocket. Útil cuando no tienes hardware físico.

const WebSocket = require('ws');
const fetch = require('node-fetch');

const SERVER_WS = process.env.SERVER_WS || 'ws://localhost:4000';
const SERVER_HTTP = process.env.SERVER_HTTP || 'http://localhost:4000';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '5000', 10);

let running = true;

async function sendTelemetry() {
  const payload = {
    humidity: Math.round(40 + Math.random() * 40),
    temperature: Math.round(18 + Math.random() * 8),
    time: Date.now(),
  };
  try {
    const res = await fetch(`${SERVER_HTTP}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('Telemetry POST failed:', res.status, txt.slice(0, 200));
    } else {
      console.log('Telemetry sent:', payload);
    }
  } catch (err) {
    console.error('Telemetry send error:', err.message);
  }
}

async function main() {
  console.log('Starting Tinkercad simulator (HTTP ->', SERVER_HTTP, ', WS ->', SERVER_WS, ')');

  const ws = new WebSocket(SERVER_WS);
  ws.on('open', () => console.log('Simulator WS connected'));
  ws.on('message', (msg) => {
    try {
      const m = JSON.parse(msg);
      console.log('Received WS message:', m);
      if (m.type === 'trigger') {
        // simular sensor de accion: 
        const ack = {
          humidity: Math.round(40 + Math.random() * 40),
          temperature: Math.round(18 + Math.random() * 8),
          time: Date.now(),
          note: 'ack_trigger',
          trigger: m.payload || null,
        };
        fetch(`${SERVER_HTTP}/api/telemetry`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ack)
        }).then(() => console.log('Sent trigger ACK as telemetry'))
          .catch(err => console.error('ACK send error:', err.message));
      }
    } catch (err) {}
  });

  // telemetria periódica
  while (running) {
    await sendTelemetry();
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

process.on('SIGINT', () => { running = false; console.log('Stopping simulator...'); process.exit(0); });

main();
