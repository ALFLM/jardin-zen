import { useEffect, useRef, useState } from 'react'
import './SoundControl.css'

const SoundControl = () => {
  const [isSoundOn, setIsSoundOn] = useState(true)
  const audioContextRef = useRef(null)
  const melodyOscillatorRef = useRef(null)
  const melodyGainRef = useRef(null)
  const melodyTimeoutRef = useRef(null)

  useEffect(() => {
    const initAudio = () => {
      if (audioContextRef.current) return

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext

      // Create calm ambient melody
      const createMelodyNote = (frequency, startTime, duration) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()
        
        // Smooth sine wave
        osc.type = 'sine'
        osc.frequency.value = frequency
        
        // Smooth envelope
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.05, startTime + 0.3)
        gain.gain.linearRampToValueAtTime(0.02, startTime + duration - 0.2)
        gain.gain.linearRampToValueAtTime(0, startTime + duration)
        
        // Low pass filter for softness
        filter.type = 'lowpass'
        filter.frequency.value = 1000
        
        osc.connect(gain)
        gain.connect(filter)
        filter.connect(audioContext.destination)
        
        osc.start(startTime)
        osc.stop(startTime + duration)
        
        return osc
      }

      // Melody sequence (calming, low frequencies)
      const melodySequence = [
        { freq: 55, duration: 2 },   // A1
        { freq: 65.41, duration: 2 }, // C#2
        { freq: 55, duration: 2 },    // A1
        { freq: 73.42, duration: 2 }, // D#2
        { freq: 55, duration: 2 },    // A1
        { freq: 61.74, duration: 2 }, // B1
        { freq: 55, duration: 2 },    // A1
        { freq: 49, duration: 2 },    // G1
      ]

      let totalTime = 0
      const playMelodySequence = () => {
        if (!isSoundOn) return

        melodySequence.forEach((note) => {
          createMelodyNote(note.freq, audioContext.currentTime + totalTime, note.duration)
          totalTime += note.duration
        })

        // Repeat melody every ~16 seconds
        melodyTimeoutRef.current = setTimeout(playMelodySequence, totalTime * 1000)
      }

      playMelodySequence()

      // Occasional gentle bong sounds
      const playBong = () => {
        if (!isSoundOn || !audioContextRef.current) return

        const now = audioContext.currentTime
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(120, now)
        osc.frequency.exponentialRampToValueAtTime(50, now + 2)

        gain.gain.setValueAtTime(0.1, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2)

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.start(now)
        osc.stop(now + 2)
      }

      // Schedule random bongs every 12-18 seconds
      const scheduleBongs = () => {
        if (isSoundOn) {
          playBong()
          setTimeout(scheduleBongs, Math.random() * 6000 + 12000)
        }
      }

      scheduleBongs()
    }

    if (isSoundOn) {
      initAudio()
    } else {
      if (melodyTimeoutRef.current) {
        clearTimeout(melodyTimeoutRef.current)
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
