const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { WebSocketServer } = require('ws');

let SerialPort;
let ReadlineParser;

// ========== SerialPort (Opcional) ==========
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

// ==================================================
// DB INIT
// ==================================================
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
    created_at INTEGER,
    duration INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS watering_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER,
    ended_at INTEGER,
    duration INTEGER,
    source TEXT
  )`);
});

// ==================================================
// SERIAL (Arduino) Opcional
// ==================================================
const SERIAL_PORT = (process.env.SERIAL_PORT || '').trim();
let port;

if (SerialPort && ReadlineParser && SERIAL_PORT) {
  try {
    port = new SerialPort({
      path: SERIAL_PORT,
      baudRate: 9600,
      autoOpen: false
    });

    port.on('error', (err) =>
      console.warn('Serial port error:', err.message)
    );

    port.open((err) => {
      if (err) {
        console.warn('Serial port failed to open:', err.message);
        return;
      }
      console.log(`Serial port opened (${SERIAL_PORT})`);

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      parser.on('data', (line) => {
        try {
          const data = JSON.parse(line);

          const telemetry = {
            time: Date.now(),
            humidity: data.humidity,
            temperature: data.temperature
          };

          console.log('📡 Arduino:', telemetry);

          db.run(
            'INSERT INTO telemetry(time, humidity, temperature) VALUES (?, ?, ?)',
            [telemetry.time, telemetry.humidity, telemetry.temperature]
          );

          const msg = JSON.stringify({ type: 'telemetry', payload: telemetry });

          wss.clients.forEach((client) => {
            if (client.readyState === 1) client.send(msg);
          });

        } catch (err) {
          console.error('Serial parse error:', err.message);
        }
      });
    });

  } catch (err) {
    console.warn('Serial port not available:', err.message);
  }
} else {
  console.warn("⚠ SerialPort deshabilitado");
}

// ==================================================
// API REST ENDPOINTS
// ==================================================

// Crear una programación de riego
app.post('/api/programs', (req, res) => {
  const { days, time, duration } = req.body;
  if (!days || !time)
    return res.status(400).json({ error: 'days and time required' });

  db.run(
    'INSERT INTO programs(date, time, created_at, duration) VALUES (?, ?, ?, ?)',
    [days, time, Date.now(), duration || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const program = {
        id: this.lastID,
        days,
        time,
        duration: duration || null
      };

      // notificar a los clientes WS
      wss.clients.forEach((client) => {
        if (client.readyState === 1)
          client.send(JSON.stringify({ type: 'program_saved', program }));
      });

      res.json(program);
    }
  );
});

// Listar programaciones
app.get('/api/programs', (req, res) => {
  db.all(
    'SELECT id, date as days, time, duration, created_at FROM programs ORDER BY created_at DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Eliminar programación
app.delete('/api/programs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.run('DELETE FROM programs WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: 'not found' });

    wss.clients.forEach((client) => {
      if (client.readyState === 1)
        client.send(JSON.stringify({ type: 'program_deleted', id }));
    });

    res.json({ success: true });
  });
});

// Forzar un comando a WS (WATER_ON / WATER_OFF)
app.post('/api/send-string', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  wss.clients.forEach((client) => {
    if (client.readyState === 1)
      client.send(JSON.stringify({ type: 'raw', payload: { text } }));
  });

  res.json({ ok: true });
});

// Telemetría GET
app.get('/api/telemetry', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);

  db.all(
    'SELECT time, humidity, temperature FROM telemetry ORDER BY time DESC LIMIT ?',
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Telemetría POST (desde Tinkercad)
app.post('/api/telemetry', (req, res) => {
  const { humidity, temperature, time } = req.body;
  const ts = time || Date.now();

  if (humidity == null || temperature == null)
    return res.status(400).json({ error: 'humidity & temperature required' });

  db.run(
    'INSERT INTO telemetry(time, humidity, temperature) VALUES (?, ?, ?)',
    [ts, humidity, temperature]
  );

  const item = { time: ts, humidity, temperature };

  const msg = JSON.stringify({ type: 'telemetry', payload: item });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });

  res.json({ ok: true, item });
});

// Registrar historial de riego
app.post('/api/watering-history', (req, res) => {
  const { started_at, ended_at, duration, source } = req.body;

  if (!started_at || !ended_at)
    return res.status(400).json({ error: 'started_at and ended_at required' });

  db.run(
    'INSERT INTO watering_history(started_at, ended_at, duration, source) VALUES (?, ?, ?, ?)',
    [started_at, ended_at, duration || null, source || 'manual'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const record = {
        id: this.lastID,
        started_at,
        ended_at,
        duration,
        source: source || 'manual'
      };

      wss.clients.forEach((client) => {
        if (client.readyState === 1)
          client.send(JSON.stringify({ type: 'watering_saved', record }));
      });

      res.json(record);
    }
  );
});

// Obtener historial de riego
app.get('/api/watering-history', (req, res) => {
  db.all(
    'SELECT * FROM watering_history ORDER BY started_at DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ==================================================
// HEALTH CHECK
// ==================================================
app.get("/health", (req, res) => {
  res.json({
    http: true,
    ws: true,
    time: Date.now()
  });
});

// ==================================================
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

// ==================================================
// GUARDAR DATOS MANUALES (BD + WebSocket)
// ==================================================
app.post('/api/manual-data', (req, res) => {
  const { humidity, temperature, time } = req.body;

  if (humidity === undefined || temperature === undefined || !time) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  // 🔹 CORRECCIÓN: Convertir "HH:MM" a Timestamp (número)
  // Creamos una fecha de "hoy" con la hora que ingresaste manualmente
  const now = new Date();
  const [hours, minutes] = time.split(':'); // Separa "14:30" en [14, 30]
  
  now.setHours(hours);
  now.setMinutes(minutes);
  now.setSeconds(0);
  
  const timestamp = now.getTime(); // Esto ya es un número compatible (ej. 1716...)

  // 1. Insertar en la base de datos usando el 'timestamp' numérico
  db.run(
    'INSERT INTO telemetry(time, humidity, temperature) VALUES (?, ?, ?)',
    [timestamp, humidity, temperature],
    function (err) {
      if (err) {
        console.error("Error guardando manual:", err.message);
        return res.status(500).json({ error: err.message });
      }

      console.log(`💾 Dato manual guardado. ID: ${this.lastID}, TS: ${timestamp}`);

      // 2. Notificar a los clientes WebSocket
      const payload = {
        humidity,
        temperature,
        time: timestamp, // Enviamos el timestamp corregido al dashboard
        source: "manual",
        id: this.lastID
      };

      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(payload));
        }
      });

      res.json({ ok: true, id: this.lastID });
    }
  );
});