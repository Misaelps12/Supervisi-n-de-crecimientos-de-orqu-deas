import React, { useEffect, useState } from "react";
import "./dashboard-theme.css";

export default function History() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

  // Cargar datos al entrar a la pantalla
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/telemetry?limit=50`);
        const data = await res.json();
        setHistoryData(data);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [API]); // Agregamos API como dependencia para quitar el warning

  return (
    <div className="dashboard-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>📜 Historial de Mediciones</h2>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: "8px 15px", cursor: "pointer" }}
        >
          🔄 Actualizar
        </button>
      </div>

      <p style={{ color: "#666" }}>
        Aquí aparecen tanto los datos de los sensores reales como los ingresados manualmente.
      </p>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>💧 Humedad</th>
                <th>🌡 Temperatura</th>
              </tr>
            </thead>
            <tbody>
              {historyData.length > 0 ? (
                historyData.map((item, index) => {
                  // Verificamos si la fecha es válida
                  const dateObj = new Date(item.time);
                  const isValidDate = !isNaN(dateObj.getTime());

                  return (
                    <tr key={index}>
                      <td>
                        {isValidDate 
                          ? dateObj.toLocaleString("es-CL", {
                              day: "2-digit", month: "2-digit", 
                              hour: "2-digit", minute: "2-digit", second: "2-digit"
                            })
                          : `Hora: ${item.time}` /* Para datos viejos */
                        }
                      </td>
                      <td>{Number(item.humidity).toFixed(1)}%</td>
                      <td>{Number(item.temperature).toFixed(1)}°C</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>No hay datos registrados aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}