import { useState } from "react";

export default function Schedule() {
  const [days, setDays] = useState("lunes, jueves");
  const [time, setTime] = useState("07:30");
  const [duration, setDuration] = useState(5); // segundos
  const [statusMessage, setStatusMessage] = useState('');
  const [watering, setWatering] = useState(false);

  const save = () => {
    const program = { days, time, duration };

    fetch('http://localhost:4000/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: days, time, duration }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error en servidor');
        return res.json();
      })
      .then(() => {
        setStatusMessage(`Riego programado: ${days} a las ${time} (${duration}s)`);
      })
      .catch((err) => {
        console.error('Error guardando programación:', err);
        setStatusMessage('No se pudo guardar la programación en el servidor.');
      });
  };

  const sendNow = async () => {
    try {
      // Enviar comando de encendido
      await fetch('http://localhost:4000/api/send-string', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'WATER_ON' }),
      });
      setStatusMessage('Riego iniciado');
      setWatering(true);

      // Apagar después de duration segundos
      setTimeout(async () => {
        try {
          await fetch('http://localhost:4000/api/send-string', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'WATER_OFF' }),
          });
          console.log('Se envió comando WATER_OFF');
          setStatusMessage('Riego finalizado');
        } catch (err) {
          console.error('Error enviando WATER_OFF', err);
          setStatusMessage('Error al finalizar riego');
        } finally {
          setWatering(false);
        }
      }, duration * 1000);
    } catch (err) {
      console.error('Error enviando WATER_ON', err);
      setStatusMessage('No se pudo enviar el comando de riego ahora');
    }
  };

  return (
    <div>
      <h2>💧 Calendario de Riego</h2>
      <label>Días: </label>
      <input value={days} onChange={e => setDays(e.target.value)} />
      <br />
      <label>Hora: </label>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} />
      <br />
      <label>Duración (segundos): </label>
      <input type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ width: 80 }} />
      <br />
      <button onClick={save}>Guardar</button>
      <button onClick={sendNow} style={{ marginLeft: 8 }} disabled={watering}>Disparar ahora</button>
      {statusMessage && <div style={{ marginTop: 8 }}>{statusMessage}</div>}
    </div>
  );
}
