import React from "react";

export default function Portada({ onEnter }) {
  return (
    <div className="portada-wrapper">
      <div className="portada-card-container">
        <div className="portada-card">
          
          {/* IMAGEN LOCAL CORREGIDA */}
          <div className="portada-image-container">
            <img 
              src="/joseph-gonzalez-OyCl7Y4y0Bk-unsplash.jpg" 
              alt="Orquídea Phalaenopsis" 
              className="portada-image"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src="https://images.unsplash.com/photo-1588528299240-7968391166b3?q=80&w=1000"; // Respaldo por si falla la local
              }}
            />
          </div>

          <div className="portada-header">
            <h1 className="titulo-principal">FRUTOS DEL MUNDO</h1>
            <p className="subtitulo-proyecto">Sistema de Monitoreo IoT & Cloud Computing</p>
          </div>

          <hr className="divider" />

          <div className="portada-body">
            <p>
              Bienvenido al panel de control centralizado. Este sistema permite la gestión 
              en tiempo real de sensores de humedad y temperatura, integración con Arduino 
              y almacenamiento de datos históricos para la optimización de cultivos.
            </p>
          </div>

          <div className="portada-team">
            <h3>Equipo de Desarrollo:</h3>
            <div className="team-grid">
              <div className="member">Misael Oyarzún</div>
              <div className="member">Michael Cifuentes</div>
              <div className="member">Michael Inostroza</div>
              <div className="member">Benjamin Urbina</div>
              <div className="member">Dafne Poblete</div>
            </div>
          </div>

          <button className="btn-start" onClick={onEnter}>
            INGRESAR AL SISTEMA
          </button>
        </div>
      </div>

      <footer className="portada-footer-improved">
        <div className="footer-content">
          <span>© 2025 <strong>Frutos del Mundo</strong></span>
          <span className="separator">|</span>
          <span>Santo Tomás — Integración de Competencias II</span>
        </div>
      </footer>
    </div>
  );
}