import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState({ humidity: 0, temperature: 0 });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setData(payload);
    };
  }, []);

  return (
    <div>
      <h2>🌱 Tiempo Real</h2>
      <p>Humedad: {data.humidity}%</p>
      <p>Temperatura: {data.temperature}°C</p>
    </div>
  );
}


