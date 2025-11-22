import { useEffect, useState } from 'react';

export default function Programs() {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawText, setRawText] = useState('');

  const fetchPrograms = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/programs`)
      .then((res) => {
        if (!res.ok) throw new Error('Error fetching programs');
        return res.json();
      })
      .then((data) => {
        setPrograms(data || []);
        setError(null);
      })
      .catch((err) => {
        console.error('Fetch programs error:', err);
        setError('No se pudieron cargar las programaciones');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const sendRawString = (text) => {
    if (!text || !text.trim()) {
      alert('Ingresa un texto para enviar');
      return;
    }
    fetch(`${API_BASE}/api/send-string`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server error: ${res.status} ${txt}`);
        }
        setRawText('');
        alert('Texto enviado al bridge/serial');
      })
      .catch((err) => {
        console.error('Send string error:', err);
        alert('No se pudo enviar el texto: ' + err.message);
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar esta programación?')) return;
    fetch(`${API_BASE}/api/programs/${id}`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`delete failed: ${res.status} ${text}`);
        }
        // actualizacion local 
        setPrograms((prev) => prev.filter((p) => p.id !== id));
      })
      .catch((err) => {
        console.error('Delete error:', err);
        alert('No se pudo eliminar la programación');
      });
  };

  return (
    <div>
      <h2>📋 Programaciones guardadas</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={fetchPrograms}>Actualizar</button>
        <div style={{ display: 'inline-block', marginLeft: 12 }}>
          <input
            placeholder="Texto para enviar al sensor"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{ padding: '4px 8px', marginRight: 6 }}
          />
          <button onClick={() => sendRawString(rawText)}>Enviar</button>
        </div>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <ul>
          {programs.length === 0 && <li>No hay programaciones.</li>}
          {programs.map((p) => (
            <li key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{p.date} — {p.time}</span>
              <button onClick={() => handleDelete(p.id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

