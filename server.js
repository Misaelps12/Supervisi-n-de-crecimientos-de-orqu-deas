const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { WebSocketServer } = require('ws');

// 'serialport' puede exportar de forma diferente según la versión; intentar soportar ambas formas

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
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Inicializar la base de datos SQLite (archivo: data.db)
const db = new sqlite3.Database('./data.db', (err) => {
  if (err) return console.error('DB open error:', err);
  console.log('SQLite DB opened');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time INTEGER,
    humidity REAL,
    temperature REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    time TEXT,
    created_at INTEGER
  )`);
  
  // Asegurarse de que exista la columna duration (segundos) en la tabla programs
  db.run('ALTER TABLE programs ADD COLUMN duration INTEGER', (err) => {
    // Si ya existe la columna, SQLite lanzará un error; lo ignoramos
    if (err) {
      // console.log('duration column may already exist:', err.message);
    }
  });
});

// Puerto serie (opcional) - ajustar el puerto COM mediante la variable de entorno SERIAL_PORT
// Para desactivar el serial, no establezcas SERIAL_PORT o déjalo vacío.
const SERIAL_PORT = (process.env.SERIAL_PORT || '').trim();
let port;
if (SerialPort && ReadlineParser && SERIAL_PORT) {
  try {
    // Crear el puerto pero no abrirlo inmediatamente para poder adjuntar manejadores de error primero
    port = new SerialPort({ path: SERIAL_PORT, baudRate: 9600, autoOpen: false });

    port.on('error', (err) => {
      console.warn('Serial port error (non-fatal):', err.message);
    });

    port.open((err) => {
      if (err) {
        console.warn('Serial port failed to open (non-fatal):', err.message);
        return;
      }
      console.log(`Serial port opened (${SERIAL_PORT})`);
      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      parser.on('data', (line) => {
        try {
          const data = JSON.parse(line);
          console.log('📡 Arduino:', data);

          // Enviar los datos al WebSocket
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify(data));
            }
          });

          // Guardar en SQLite
          db.run('INSERT INTO telemetry(time, humidity, temperature) VALUES (?, ?, ?)',
            [Date.now(), data.humidity, data.temperature]
          );
        } catch (err) {
          console.error('Serial parse error:', err.message);
        }
      });
    });
  } catch (err) {
    console.warn('Serial port not available; serial features disabled:', err.message || err);
  }
} else {
  if (!SerialPort || !ReadlineParser) {
    console.warn('serialport or parser not available; serial features disabled');
  } else if (!SERIAL_PORT) {
    console.log('SERIAL_PORT not set; serial features are disabled. Set SERIAL_PORT=COM3 (or similar) to enable.');
  }
}

// Endpoints API para guardar/recuperar programaciones
app.post('/api/programs', (req, res) => {
  const { date, time, duration } = req.body;
  if (!date || !time) return res.status(400).json({ error: 'date and time required' });

  db.run('INSERT INTO programs(date, time, created_at, duration) VALUES (?, ?, ?, ?)', [date, time, Date.now(), duration || null], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const program = { id: this.lastID, date, time, duration: duration || null };
    // notificar a los clientes WebSocket sobre la nueva programación
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(JSON.stringify({ type: 'program_saved', program }));
    });
    res.json(program);
  });
});

app.get('/api/programs', (req, res) => {
  db.all('SELECT id, date, time, duration, created_at FROM programs ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Eliminar una programación por id
app.delete('/api/programs/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  db.run('DELETE FROM programs WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    // notificar a los clientes
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(JSON.stringify({ type: 'program_deleted', id }));
    });
    res.json({ success: true });
  });
});

// Disparar una acción (por ejemplo, ejecutar una programación o enviar comando al hardware)
app.post('/api/trigger', (req, res) => {
  const payload = req.body || {};
  // Broadcast trigger to websocket clients (hardware or UI)
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify({ type: 'trigger', payload }));
  });
  res.json({ ok: true });
});

// Send a raw string to serial clients via WebSocket/bridge
app.post('/api/send-string', (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string') return res.status(400).json({ error: 'text string required' });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify({ type: 'raw', payload: { text } }));
  });
  res.json({ ok: true, sent: text });
});

// Telemetry endpoint: devuelve las últimas lecturas
app.get('/api/telemetry', (req, res) => {
  // opcional: ?limit=100
  const limit = parseInt(req.query.limit || '100', 10);
  db.all('SELECT time, humidity, temperature FROM telemetry ORDER BY time DESC LIMIT ?', [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ time: r.time, humidity: r.humidity, temperature: r.temperature })));
  });
});

// Accept telemetry POSTs (useful for simulators/bridges)
app.post('/api/telemetry', (req, res) => {
  const { humidity, temperature, time } = req.body || {};
  const ts = time || Date.now();
  if (humidity == null || temperature == null) return res.status(400).json({ error: 'humidity and temperature required' });

  db.run('INSERT INTO telemetry(time, humidity, temperature) VALUES (?, ?, ?)', [ts, humidity, temperature], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const item = { time: ts, humidity, temperature };
    // broadcast to websocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(JSON.stringify(item));
    });
    res.json({ ok: true });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

