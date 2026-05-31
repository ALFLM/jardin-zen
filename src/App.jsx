import { useState, useEffect, useRef } from 'react'
import ZenGardenCanvas from './components/ZenGardenCanvas'
import SoundControl from './components/SoundControl'
import { getRandomPhilosophy } from './philosophies'
import './App.css'

function App() {
  const [showInfo, setShowInfo] = useState(false)
  const [currentDialog, setCurrentDialog] = useState(null)
  const dialogTimeoutRef = useRef(null)

  const handleCharacterDialog = () => {
    // Clear existing timeout
    if (dialogTimeoutRef.current) {
      clearTimeout(dialogTimeoutRef.current)
    }

    // Show new dialog
    const dialog = getRandomPhilosophy()
    setCurrentDialog(dialog)

    // Hide dialog after 3 seconds
    dialogTimeoutRef.current = setTimeout(() => {
      setCurrentDialog(null)
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (dialogTimeoutRef.current) {
        clearTimeout(dialogTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="app-container">
      <ZenGardenCanvas onCharacterDialog={handleCharacterDialog} currentDialog={currentDialog} />
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
          <p style={{ marginTop: '15px', fontSize: '12px', opacity: 0.8 }}>
            El jardinero te acompañará en tu meditación con sus reflexiones.
          </p>
        </div>
      )}
    </div>
  )
}

export default App
