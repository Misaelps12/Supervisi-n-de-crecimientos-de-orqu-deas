const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");

const port = new SerialPort({ path: "COM3", baudRate: 9600 }); // Ajusta COM3 según tu PC
const parser = port.pipe(new Readline({ delimiter: "\n" }));

parser.on("data", (line) => {
  try {
    const data = JSON.parse(line);
    console.log("📡 Arduino:", data);

    // Enviar a WebSocket
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });

    // Guardar en SQLite
    db.run("INSERT INTO telemetry(time, humidity, temperature) VALUES (?, ?, ?)",
      [Date.now(), data.humidity, data.temperature]
    );
  } catch (err) {
    console.error("Error:", err);
  }
});

