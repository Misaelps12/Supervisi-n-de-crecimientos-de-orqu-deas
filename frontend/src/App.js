import './App.css';
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Schedule from "./components/Schedule";
import Programs from "./components/Programs";


function App() {
  return (
    <div className="container">
      <header>
        <h1>🌸 Monitoreo de Orquídeas</h1>
        <p>Control ambiental en tiempo real y calendario de riego</p>
      </header>
      <main>
        <section className="card">
          <Dashboard />
        </section>
        <section className="card">
          <History />
        </section>
        <section className="card">
          <Schedule />
        </section>
        <section className="card">
          <Programs />
        </section>
      </main>
      <footer>
        <p>© 2025 Cultivo Inteligente | Proyecto Integración de Competencias II</p>
      </footer>
    </div>
  );
}

export default App;
