import { useEffect, useRef, useState } from 'react'
import './SoundControl.css'

const SoundControl = () => {
  const [isSoundOn, setIsSoundOn] = useState(true)
  const audioContextRef = useRef(null)
  const oscillatorRef = useRef(null)
  const gainNodeRef = useRef(null)
  const whiteNoiseRef = useRef(null)

  useEffect(() => {
    const initAudio = () => {
      if (audioContextRef.current) return

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext

      // Create white noise
      const bufferSize = audioContext.sampleRate * 2
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = Math.random() * 2 - 1
      }

      const noiseSource = audioContext.createBufferSource()
      noiseSource.buffer = noiseBuffer
      noiseSource.loop = true

      const whiteNoiseGain = audioContext.createGain()
      whiteNoiseGain.gain.value = 0.1
      noiseSource.connect(whiteNoiseGain)
      whiteNoiseGain.connect(audioContext.destination)
      noiseSource.start(0)

      whiteNoiseRef.current = { source: noiseSource, gain: whiteNoiseGain }

      // Create occasional bong sounds
      const playBong = () => {
        if (!isSoundOn || !audioContextRef.current) return

        const now = audioContext.currentTime
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.frequency.setValueAtTime(120, now)
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 3)

        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 3)

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.start(now)
        osc.stop(now + 3)
      }

      // Schedule random bongs
      const scheduleBongs = () => {
        if (isSoundOn) {
          playBong()
          setTimeout(scheduleBongs, Math.random() * 10000 + 8000)
        }
      }

      scheduleBongs()
    }

    if (isSoundOn) {
      initAudio()
      if (whiteNoiseRef.current) {
        whiteNoiseRef.current.gain.gain.target = 0.1
      }
    } else {
      if (whiteNoiseRef.current) {
        whiteNoiseRef.current.gain.gain.target = 0
      }
    }
  }, [isSoundOn])

  const toggleSound = () => {
    setIsSoundOn(!isSoundOn)
  }

  return (
    <div className="sound-control">
      <button
        className={`sound-button ${isSoundOn ? '' : 'off'}`}
        onClick={toggleSound}
        title={isSoundOn ? 'Silenciar sonido' : 'Activar sonido'}
      >
        {isSoundOn ? '🔊' : '🔇'}
      </button>
    </div>
  )
}

export default SoundControl
