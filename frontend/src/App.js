import { useState } from "react";
import "./App.css"; // O tus estilos globales
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Portada from "./components/Portada";

function App() {
  // Estado para controlar qué pantalla se ve
  // Si showPortada es true, se ve la portada. Si es false, se ve la app.
  const [showPortada, setShowPortada] = useState(true);
  
  // Estado para navegar entre Dashboard e Historial (tu navegación actual)
  const [currentView, setCurrentView] = useState("dashboard");

  // Si estamos en modo portada, mostramos solo eso
  if (showPortada) {
    return <Portada onEnter={() => setShowPortada(false)} />;
  }

  // Si no, mostramos la aplicación completa (Navbar + Contenido)
  return (
    <div className="App">
      {/* NAVBAR SUPERIOR */}
      <nav className="navbar">
        <div className="logo">🌱 Frutos del Mundo</div>
        <div className="menu">
          <button 
            className={currentView === "dashboard" ? "active" : ""} 
            onClick={() => setCurrentView("dashboard")}
          >
            Dashboard
          </button>
          <button 
            className={currentView === "history" ? "active" : ""} 
            onClick={() => setCurrentView("history")}
          >
            Historial
          </button>
          {/* Agrega más botones si tienes más componentes */}
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "history" && <History />}
        {/* {currentView === "programs" && <Programs />} */}
      </div>
    </div>
  );
}

export default App;