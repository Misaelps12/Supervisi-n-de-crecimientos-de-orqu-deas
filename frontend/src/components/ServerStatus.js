import { useEffect, useState } from "react";

export default function ServerStatus() {
  const API = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const [status, setStatus] = useState({ http: false, ws: false });

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API}/health`);
        const data = await res.json();
        setStatus(data);
      } catch {
        setStatus({ http: false, ws: false });
      }
    };
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <h3>📡 Estado del Sistema</h3>
      <p>HTTP API: {status.http ? "🟢 Activo" : "🔴 Caído"}</p>
      <p>WebSocket: {status.ws ? "🟢 Activo" : "🔴 Caído"}</p>
    </div>
  );
}
