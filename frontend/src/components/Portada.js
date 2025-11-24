import React from "react";
import "./dashboard-theme.css"; 

export default function Portada({ onEnter }) {
  return (
    <div className="portada-wrapper">
      <div className="portada-card">
        {/* Encabezado */}
        <div className="portada-header">
          <span className="icon-logo">🌱</span>
          <h1 className="titulo-principal">FRUTOS DEL MUNDO</h1>
          <p className="subtitulo-proyecto">Sistema de Monitoreo IoT & Cloud Computing</p>
        </div>

        <hr className="divider" />

        {/* Descripción */}
        <div className="portada-body">
          <p>
            Bienvenido al panel de control centralizado. Este sistema permite la gestión 
            en tiempo real de sensores de humedad y temperatura, integración con Arduino 
            y almacenamiento de datos históricos para la optimización de cultivos.
          </p>
        </div>

        {/* Integrantes */}
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

        {/* Botón de Acción */}
        <button className="btn-start" onClick={onEnter}>
          INGRESAR AL SISTEMA
        </button>

        <div className="portada-footer">
          Santo Tomas — Integracion de Competencia II — 2025
        </div>
      </div>
    </div>
  );
}