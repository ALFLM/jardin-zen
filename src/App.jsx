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
            <li><strong>Ratón (Arrastrar):</strong> Usa el rastrillo para hacer líneas en la arena</li>
            <li><strong>Click derecho:</strong> Coloca piedras en el jardín</li>
            <li><strong>Rueda del ratón:</strong> Zoom in/out</li>
            <li><strong>Sonido:</strong> Botón verde inferior-izquierda para activar/desactivar</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default App
