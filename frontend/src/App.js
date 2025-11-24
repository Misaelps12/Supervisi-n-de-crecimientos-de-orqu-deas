import { useState } from "react";
import "./components/dashboard-theme.css";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Portada from "./components/Portada";
import OrchidsInfo from "./components/OrchidsInfo"; 

function App() {
  const [showPortada, setShowPortada] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");

  if (showPortada) {
    return <Portada onEnter={() => setShowPortada(false)} />;
  }

  return (
    <div className="App">
      <nav className="navbar" style={{ 
          background: "#2c3e50", 
          padding: "15px 20px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          color: "white"
        }}>
        <div className="logo" style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
          🌱 Frutos del Mundo
        </div>
        
        <div className="menu">
          {/* Botón Dashboard */}
          <button 
            style={{ background: currentView === "dashboard" ? "#4CAF50" : "transparent", marginLeft: "10px" }}
            onClick={() => setCurrentView("dashboard")}
          >
            Dashboard
          </button>

          {/* Botón Historial */}
          <button 
            style={{ background: currentView === "history" ? "#4CAF50" : "transparent", marginLeft: "10px" }}
            onClick={() => setCurrentView("history")}
          >
            Historial
          </button>

          {/* 2. NUEVO: Botón de Información */}
          <button 
            style={{ background: currentView === "info" ? "#4CAF50" : "transparent", marginLeft: "10px" }}
            onClick={() => setCurrentView("info")}
          >
            📖 Sobre las Orquídeas
          </button>
        </div>
      </nav>

      <div className="main-content">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "history" && <History />}
        {/* 3. NUEVO: Mostrar el componente */}
        {currentView === "info" && <OrchidsInfo />}
      </div>
    </div>
  );
}

export default App;