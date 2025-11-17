import './App.css';
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Schedule from "./components/Schedule";

function App() {
  return (
    <div className="App" style={{ padding: 20 }}>
      <h1>🌸 Monitoreo de Orquídeas</h1>
      <Dashboard />
      <History />
      <Schedule />
    </div>
  );
}

export default App;
