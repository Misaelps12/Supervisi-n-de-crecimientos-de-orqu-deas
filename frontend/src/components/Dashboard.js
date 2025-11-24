import { useEffect, useState } from "react";
import "./dashboard-theme.css";
// 1. IMPORTAR EL HISTORIAL AQUÍ
import History from "./History"; 

export default function Dashboard() {
  const [data, setData] = useState({ humidity: 0, temperature: 0, time: null });
  const [mode, setMode] = useState("day");

  // Estado para el ingreso manual
  const [manual, setManual] = useState({
    humidity: "",
    temperature: "",
    time: "",
  });
  
  const [pastedText, setPastedText] = useState("");

  const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const RANGES = {
    day: { min: 18, max: 26 },
    night: { min: 12, max: 23 },
    humidity: { min: 50, max: 80 },
  };

  function getWarnings(humidity, temperature, mode) {
    const warnings = [];
    const tempRange = RANGES[mode];

    if (temperature < tempRange.min) warnings.push(`⚠️ Temp baja (${temperature}°C)`);
    else if (temperature > tempRange.max) warnings.push(`⚠️ Temp alta (${temperature}°C)`);

    if (humidity < RANGES.humidity.min) warnings.push(`💧 Humedad baja (${humidity}%)`);
    else if (humidity > RANGES.humidity.max) warnings.push(`💧 Humedad alta (${humidity}%)`);

    return warnings;
  }

  useEffect(() => {
    const WS_BASE = process.env.REACT_APP_WS_URL || "ws://localhost:4000";
    const ws = new WebSocket(WS_BASE);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.humidity !== undefined && payload.temperature !== undefined) {
          setData({
            humidity: payload.humidity,
            temperature: payload.temperature,
            time: payload.time || Date.now(),
          });
        }
      } catch (err) {
        console.error("Error parsing WS data:", err);
      }
    };
    return () => ws.close();
  }, []);

  const warnings = getWarnings(data.humidity, data.temperature, mode);

  function handleManualChange(e) {
    setManual({ ...manual, [e.target.name]: e.target.value });
  }

  function handleTinkercadPaste(e) {
    const text = e.target.value;
    setPastedText(text);

    const regex = /Humedad:\s*([\d.,]+)\s*%\s*Temperatura:\s*([\d.,]+)/i;
    const match = text.match(regex);

    if (match) {
      const hum = match[1].replace(',', '.');
      const temp = match[2].replace(',', '.');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      setManual({
        humidity: hum,
        temperature: temp,
        time: timeStr
      });
    }
  }

  async function sendManual() {
    if (!manual.humidity || !manual.temperature || !manual.time) {
      alert("Completa todos los campos o pega el texto de Tinkercad");
      return;
    }

    try {
      const res = await fetch(`${API}/api/manual-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          humidity: Number(manual.humidity),
          temperature: Number(manual.temperature),
          time: manual.time,
        }),
      });

      if (!res.ok) throw new Error("Error en servidor");
      
      await res.json();
      alert("Datos enviados manualmente ✔");
      
      // Hacemos un reload rápido para que se actualice el historial de abajo
      window.location.reload(); 

    } catch (err) {
      console.error("Error enviando manual:", err);
      alert("No se pudo enviar");
    }
  }

  return (
    <div className={`dashboard-wrapper ${mode}`}>
      <h2>🌱 Tiempo Real</h2>

      <div className="mode-switch">
        <label>Modo ambiental:</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="day">🌞 Orquídea diurna</option>
          <option value="night">🌙 Orquídea nocturna</option>
        </select>
      </div>

      <div className="dashboard-cards">
        <div className="card-item">
          <h3>💧 Humedad</h3>
          <p>{data.humidity}%</p>
        </div>
        <div className="card-item">
          <h3>🌡 Temperatura</h3>
          <p>{data.temperature}°C</p>
        </div>
        <div className="card-item">
          <h3>🕒 Última lectura</h3>
          <p>{data.time ? new Date(data.time).toLocaleString() : "—"}</p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="warning-box">
          <h3>⚠️ Advertencias</h3>
          <ul>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* ZONA DE INGRESO MANUAL */}
      <div className="manual-box" style={{ marginTop: '20px', borderTop: '2px solid #ccc', paddingTop: '10px' }}>
        <h3>✍ Ingreso Manual / Tinkercad</h3>
        <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📋 Pegar línea de Tinkercad aquí:
            </label>
            <input 
                type="text" 
                placeholder='Ej: "Humedad: 37,00 % Temperatura: 24,00 °C"'
                value={pastedText}
                onChange={handleTinkercadPaste}
                style={{ width: '100%', padding: '8px', border: '2px dashed #666' }}
            />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div><label>Humedad</label><input type="number" name="humidity" value={manual.humidity} onChange={handleManualChange}/></div>
            <div><label>Temp</label><input type="number" name="temperature" value={manual.temperature} onChange={handleManualChange}/></div>
            <div><label>Hora</label><input type="time" name="time" value={manual.time} onChange={handleManualChange}/></div>
        </div>

        <button onClick={sendManual} style={{ marginTop: '10px', width: '100%' }}>Enviar Datos</button>
      </div>

      <hr style={{margin: "40px 0"}}/>

      {/* 2. AGREGAR EL COMPONENTE DE HISTORIAL AQUÍ AL FINAL */}
      <div className="integrated-history">
        <History />
      </div>

    </div>
  );
}