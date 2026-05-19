import { useRef, useState } from 'react'

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }

  const stopRecording = (): Promise<string> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current!
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')
        const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
        const { transcript } = await response.json()
        setIsRecording(false)
        resolve(transcript as string)
      }
      recorder.stop()
      recorder.stream.getTracks().forEach((t) => t.stop())
    })
  }

  return { startRecording, stopRecording, isRecording }
}
