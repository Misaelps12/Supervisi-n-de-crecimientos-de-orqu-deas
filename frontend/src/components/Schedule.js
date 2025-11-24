import { useState, useEffect } from "react";

export default function Schedule() {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const [days, setDays] = useState("lunes, jueves");
  const [time, setTime] = useState("07:30");
  const [duration, setDuration] = useState(5);
  const [statusMessage, setStatusMessage] = useState("");
  const [watering, setWatering] = useState(false);
  const [programs, setPrograms] = useState([]);

  // --- Cargar programaciones al abrir ---
  useEffect(() => {
    fetch(`${API_BASE}/api/programs`)
      .then((res) => res.json())
      .then((data) => setPrograms(data || []))
      .catch((err) => console.error("Error cargando programaciones:", err));
  }, [API_BASE]);

  // --- Guardar nueva programación ---
  const save = () => {
    if (!days || !time || duration <= 0) {
      setStatusMessage("⚠️ Datos inválidos. Revisa días, hora y duración.");
      return;
    }

    const program = { days, time, duration };

    fetch(`${API_BASE}/api/programs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(program),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error en servidor");
        return res.json();
      })
      .then((saved) => {
        setStatusMessage(
          `✅ Riego programado: ${days} a las ${time} (${duration}s)`
        );
        setPrograms((prev) => [saved, ...prev]);
      })
      .catch((err) => {
        console.error("Error guardando programación:", err);
        setStatusMessage("❌ No se pudo guardar la programación.");
      });
  };

  // --- Eliminar programación ---
  const handleDelete = (id) => {
    fetch(`${API_BASE}/api/programs/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error("Error eliminando");
        setPrograms((prev) => prev.filter((p) => p.id !== id));
        setStatusMessage("🗑 Programación eliminada");
      })
      .catch((err) => {
        console.error("Error eliminando programación:", err);
        setStatusMessage("❌ No se pudo eliminar");
      });
  };

  // --- Riego manual inmediato ---
  const sendNow = async () => {
    try {
      const startedAt = Date.now();

      await fetch(`${API_BASE}/api/send-string`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "WATER_ON" }),
      });

      setStatusMessage("💧 Riego iniciado");
      setWatering(true);

      setTimeout(async () => {
        const endedAt = Date.now();

        try {
          await fetch(`${API_BASE}/api/send-string`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "WATER_OFF" }),
          });

          // Guardar historial
          await fetch(`${API_BASE}/api/watering-history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              started_at: startedAt,
              ended_at: endedAt,
              duration,
              source: "manual",
            }),
          });

          setStatusMessage("✅ Riego finalizado");
        } catch (err) {
          console.error("Error al finalizar riego:", err);
          setStatusMessage("❌ Error finalizando riego");
        } finally {
          setWatering(false);
        }
      }, duration * 1000);
    } catch (err) {
      console.error("Error en riego manual:", err);
      setStatusMessage("❌ No se pudo iniciar el riego");
    }
  };

  return (
    <div className="schedule-container">
      <h2>💧 Calendario de Riego</h2>

      <div className="schedule-form">
        <label>Días:</label>
        <input
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder="Ej: lunes, miércoles, viernes"
        />
        <br />

        <label>Hora:</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <br />

        <label>Duración (segundos):</label>
        <input
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{ width: 80 }}
        />
        <br />

        <button onClick={save}>Guardar</button>
        <button
          onClick={sendNow}
          style={{ marginLeft: 8 }}
          disabled={watering}
        >
          {watering ? "Regando..." : "Disparar ahora"}
        </button>
      </div>

      {statusMessage && <div className="status-msg">{statusMessage}</div>}

      <div className="schedule-list">
        <h3>📋 Programaciones guardadas</h3>

        <ul>
          {programs.length === 0 && <li>No hay programaciones.</li>}

          {[...programs]
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((p) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span>
                  {p.days} — {p.time} —{" "}
                  {p.duration ? `${p.duration}s` : "sin duración"}
                </span>

                <button onClick={() => handleDelete(p.id)}>Eliminar</button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
