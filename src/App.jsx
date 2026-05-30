import { useState, useEffect, useRef } from 'react'
import ZenGardenCanvas from './components/ZenGardenCanvas'
import SoundControl from './components/SoundControl'
import './App.css'

function App() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="app-container">
      <ZenGardenCanvas />
      <SoundControl />
      
      <button 
        className="info-button"
        onClick={() => setShowInfo(!showInfo)}
        title="Información"
      >
        ?
      </button>

      {showInfo && (
        <div className="info-modal">
          <button className="close-button" onClick={() => setShowInfo(false)}>×</button>
          <h2>Jardín Zen</h2>
          <p>Una experiencia tranquila y meditativa.</p>
          <h3>Controles:</h3>
          <ul>
            <li><strong>Ratón:</strong> Usa el rastrillo para hacer líneas en la arena</li>
            <li><strong>Click:</strong> Coloca piedras</li>
            <li><strong>Rueda del ratón:</strong> Zoom</li>
            <li><strong>Click derecho + Arrastrar:</strong> Rota la vista</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default App
