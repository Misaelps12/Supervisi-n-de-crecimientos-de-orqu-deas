const fetch = require('node-fetch');
const readline = require('readline');

const SERVER_HTTP = process.env.SERVER_HTTP || 'http://localhost:4000';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("🔧 Pega aquí las lecturas de Tinkercad (ej: Humedad: 53,00 % Temperatura: 24,00 °C):");

rl.on('line', async (line) => {
  const match = line.match(/Humedad:\s*([\d.,]+).*Temperatura:\s*([\d.,]+)/i);
  if (!match) {
    console.log("❌ Formato no reconocido:", line);
    return;
  }

  const humidity = parseFloat(match[1].replace(',', '.'));
  const temperature = parseFloat(match[2].replace(',', '.'));
  const payload = { humidity, temperature, time: Date.now() };

  try {
    const res = await fetch(`${SERVER_HTTP}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    console.log("✅ Lectura enviada:", payload);
  } catch (err) {
    console.error("❌ Error enviando al backend:", err.message);
  }
});
