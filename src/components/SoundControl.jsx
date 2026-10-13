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

      // Create calm ambient melody with filters
      const createMelodyNote = (frequency, startTime, duration) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()
        
        // Smooth sine wave
        osc.type = 'sine'
        osc.frequency.value = frequency
        
        // Smooth ADSR envelope
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.04, startTime + 0.4)
        gain.gain.linearRampToValueAtTime(0.03, startTime + duration - 0.3)
        gain.gain.linearRampToValueAtTime(0, startTime + duration)
        
        // Low pass filter for warmth and softness
        filter.type = 'lowpass'
        filter.frequency.value = 1200
        filter.Q.value = 0.5
        
        osc.connect(gain)
        gain.connect(filter)
        filter.connect(audioContext.destination)
        
        osc.start(startTime)
        osc.stop(startTime + duration)
        
        return osc
      }

      // Extended pentatonic melody sequence (calming, meditative)
      const melodySequence = [
        { freq: 55, duration: 2.5 },    // A1
        { freq: 65.41, duration: 2.5 }, // C#2
        { freq: 55, duration: 2.5 },    // A1
        { freq: 73.42, duration: 2.5 }, // D#2
        { freq: 55, duration: 2.5 },    // A1
        { freq: 61.74, duration: 2 },   // B1
        { freq: 55, duration: 3 },      // A1
        { freq: 49, duration: 3 },      // G1
      ]

      let totalTime = 0
      const playMelodySequence = () => {
        if (!isSoundOn) return

        melodySequence.forEach((note) => {
          createMelodyNote(note.freq, audioContext.currentTime + totalTime, note.duration)
          totalTime += note.duration
        })

        // Repeat melody every ~18 seconds
        melodyTimeoutRef.current = setTimeout(playMelodySequence, totalTime * 1000)
      }

      playMelodySequence()

      // Ambient pad - gentle background sustain
      const createAmbientPad = () => {
        const padOsc = audioContext.createOscillator()
        const padGain = audioContext.createGain()
        const padFilter = audioContext.createBiquadFilter()
        
        padOsc.type = 'sine'
        padOsc.frequency.value = 41.2 // E1
        
        padGain.gain.setValueAtTime(0.01, audioContext.currentTime)
        padGain.gain.linearRampToValueAtTime(0.015, audioContext.currentTime + 2)
        
        padFilter.type = 'lowpass'
        padFilter.frequency.value = 400
        padFilter.Q.value = 0.3
        
        padOsc.connect(padGain)
        padGain.connect(padFilter)
        padFilter.connect(audioContext.destination)
        
        padOsc.start(audioContext.currentTime)
        return { osc: padOsc, gain: padGain }
      }

      const ambientPad = createAmbientPad()

      // Occasional gentle bong sounds - Zen bell
      const playBong = () => {
        if (!isSoundOn || !audioContextRef.current) return

        const now = audioContext.currentTime
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(140, now)
        osc.frequency.exponentialRampToValueAtTime(60, now + 2.5)

        gain.gain.setValueAtTime(0.08, now)
        gain.gain.exponentialRampToValueAtTime(0.005, now + 2.5)

        filter.type = 'lowpass'
        filter.frequency.value = 800

        osc.connect(gain)
        gain.connect(filter)
        filter.connect(audioContext.destination)

        osc.start(now)
        osc.stop(now + 2.5)
      }

      // Schedule random bongs every 15-25 seconds
      const scheduleBongs = () => {
        if (isSoundOn) {
          playBong()
          setTimeout(scheduleBongs, Math.random() * 10000 + 15000)
        }
      }

      scheduleBongs()

      // Store references for cleanup
      return () => {
        if (ambientPad) {
          ambientPad.osc.stop(audioContext.currentTime + 1)
        }
      }
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
