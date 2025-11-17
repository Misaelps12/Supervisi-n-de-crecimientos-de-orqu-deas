import { useEffect, useState } from "react";

export default function History() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/telemetry")
      .then(res => res.json())
      .then(setRows);
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

