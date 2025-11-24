import React from "react";
// Ya no necesitamos importar CSS aquí porque App.js lo carga globalmente,
// pero no hace daño dejarlo.

export default function OrchidsInfo() {
  return (
    <div className="container">
      
      <div className="orchid-header">
        <h1>🌸 El Mundo de las Orquídeas</h1>
        <p>Conociendo a la familia de plantas más fascinante del planeta</p>
      </div>

      <div className="card">
        {/* Imagen con clase para efectos CSS */}
        <div className="orchid-image-wrapper">
          <img 
            src="https://images.unsplash.com/photo-1566914536720-3b44b8296a66?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
            alt="Orquídea Phalaenopsis" 
          />
        </div>

        <div className="info-text">
          <h2>📜 Un viaje en el tiempo</h2>
          <p>
            Las orquídeas no son solo flores bonitas; son supervivientes. Registros fósiles indican que 
            coexistieron con los dinosaurios hace más de <strong>80 millones de años</strong>. 
            Su capacidad de adaptación les ha permitido colonizar casi todos los rincones de la Tierra, 
            excepto los desiertos extremos y los polos.
          </p>

          <hr style={{ margin: "30px 0", border: "0", borderTop: "1px solid #eee" }} />

          <h2>🌡 La importancia del IoT en su cultivo</h2>
          <p>
            La mayoría de las orquídeas comerciales son <em>epífitas</em> (viven en el aire). 
            Esto significa que no tienen tierra para proteger sus raíces de los cambios bruscos.
          </p>
          
          <ul style={{ paddingLeft: "20px" }}>
            <li><strong>Humedad Crítica:</strong> Necesitan una humedad ambiental entre 50% y 80%. Menos de eso, se secan; más de eso, se pudren.</li>
            <li><strong>Choque Térmico:</strong> Para florecer, muchas especies necesitan sentir que la noche es más fría que el día (una caída de unos 5°C a 10°C).</li>
          </ul>

          {/* Caja de dato curioso con estilo */}
          <div className="dato-curioso">
            <span style={{ fontSize: "2rem" }}>🍦</span>
            <div>
              <strong>¿Sabías qué?</strong>
              <br/>
              El sabor a vainilla proviene de la orquídea <em>Vanilla planifolia</em>. 
              Es la única orquídea que se cultiva a nivel industrial para consumo humano.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}