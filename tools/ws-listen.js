// ws-listen.js
// Cliente simple para suscribirse al WebSocket del backend y mostrar mensajes entrantes.
const WebSocket = require('ws');

const WS_URL = process.env.SERVER_WS || 'ws://localhost:5000';
console.log('Connecting to', WS_URL);
const ws = new WebSocket(WS_URL);

ws.on('open', () => console.log('WS connected'));
ws.on('close', () => console.log('WS closed'));
ws.on('error', (err) => console.error('WS error', err && err.message ? err.message : err));
ws.on('message', (msg) => {
  try {
    const parsed = JSON.parse(msg);
    console.log('MSG:', JSON.stringify(parsed));
  } catch (e) {
    console.log('MSG(raw):', msg.toString());
  }
});
