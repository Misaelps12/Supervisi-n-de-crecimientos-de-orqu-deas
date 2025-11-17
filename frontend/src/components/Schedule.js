import { useState } from "react";

export default function Schedule() {
  const [days, setDays] = useState("lunes, jueves");
  const [time, setTime] = useState("07:30");

  const save = () => {
    alert(`Riego programado: ${days} a las ${time}`);
    // Aquí podrías enviar al backend con fetch POST
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
      <button onClick={save}>Guardar</button>
    </div>
  );
}
