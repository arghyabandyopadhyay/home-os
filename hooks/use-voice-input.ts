"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type VoiceInputState = {
  /** Whether the browser supports the Web Speech API */
  isSupported: boolean
  /** Whether voice recognition is currently active */
  isListening: boolean
  /** The current transcript (interim + final) */
  transcript: string
  /** Start listening for voice input */
  startListening: () => void
  /** Stop listening */
  stopListening: () => void
  /** Clear the transcript */
  clearTranscript: () => void
}

/**
 * Hook that provides voice input via the Web Speech API.
 * Returns transcript text that can be fed into search/command menu.
 *
 * - Detects browser support (Chrome, Safari, Edge)
 * - Handles interim and final results
 * - Auto-stops after silence (via the API's built-in timeout)
 * - Cleans up on unmount
 */
export function useVoiceInput(): VoiceInputState {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check support on mount
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setTranscript("")
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
  }
}
