import { useEffect, useState, useRef } from "react";

export default function History() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const WS_BASE = (process.env.REACT_APP_WS_URL) || API_BASE.replace(/^http/, 'ws');
  const [rows, setRows] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Obtener histórico inicial desde el backend
    fetch(`${API_BASE}/api/telemetry?limit=100`)
      .then(async (res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }
        if (!ct.includes('application/json')) {
          const txt = await res.text();
          throw new Error('Expected JSON but got: ' + txt.slice(0, 200));
        }
        return res.json();
      })
      .then((data) => setRows(data || []))
      .catch((err) => console.error('Error fetching telemetry:', err));

    // Conectar por WebSocket para recibir actualizaciones en tiempo real
    try {
      const ws = new WebSocket(WS_BASE);
      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          // se espera que el payload tenga { humidity, temperature, ... }
          const item = { time: Date.now(), humidity: payload.humidity, temperature: payload.temperature };
          setRows((prev) => [item, ...prev].slice(0, 200));
        } catch (err) {
          // ignorar errores de parseo
        }
      };
      wsRef.current = ws;
    } catch (err) {
      console.warn('WebSocket not available:', err.message);
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div>
      <h2>📊 Histórico</h2>
      <ul>
        {rows.map((r, i) => (
          <li key={i}>
            {new Date(r.time).toLocaleString()} — HR {r.humidity}% — T {r.temperature}°C
          </li>
        ))}
      </ul>
    </div>
  );
}

