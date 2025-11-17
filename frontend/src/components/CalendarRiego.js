import { useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

export default function CalendarRiego() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("07:30");
  const [programmed, setProgrammed] = useState([]);

  const handleSave = () => {
    setProgrammed([...programmed, { date: selectedDate, time: selectedTime }]);
    alert(`Riego programado para ${selectedDate.toLocaleDateString()} a las ${selectedTime}`);
  };

  return (
    <div>
      <h2>💧 Calendario de Riego</h2>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
      />
      <br />
      <label>Hora de riego: </label>
      <input
        type="time"
        value={selectedTime}
        onChange={(e) => setSelectedTime(e.target.value)}
      />
      <br /><br />
      <button onClick={handleSave}>Guardar programación</button>

      <h3>📅 Riegos programados:</h3>
      <ul>
        {programmed.map((p, i) => (
          <li key={i}>
            {p.date.toLocaleDateString()} a las {p.time}
          </li>
        ))}
      </ul>
    </div>
  );
}
