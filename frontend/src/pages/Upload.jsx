import { useState, useRef, useCallback, useEffect } from 'react'
import { uploadImage, uploadAudio } from '../api/upload'
import AgentThinking from '../components/AgentThinking'
import ReasoningPanel from '../components/ReasoningPanel'
import { ImageIcon, MicIcon, RotateCcwIcon, UploadIcon } from '../components/Icons'
import { useTheme } from '../providers/ThemeProvider'
import { T } from '../constants'

const ACCEPTED_IMAGE = 'image/jpeg,image/png,image/webp'
const ACCEPTED_AUDIO = 'audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/webm'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

function VoiceRecorder({ onFile, disabled }) {
  const { lang } = useTheme()
  const t = T[lang]
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [micError, setMicError] = useState(null)
  const mrRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef()

  useEffect(() => () => {
    clearInterval(timerRef.current)
    mrRef.current?.stream?.getTracks().forEach(t => t.stop())
  }, [])

  const start = async () => {
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onFile(new File([blob], 'recording.webm', { type: 'audio/webm' }))
      }
      mr.start()
      mrRef.current = mr
      setSeconds(0)
      setRecording(true)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setMicError(true)
    }
  }

  const stop = () => {
    mrRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  return (
    <div
      className="card flex flex-col items-center justify-center gap-4 border-2 border-dashed py-12 text-center transition-all duration-200"
      style={{ borderColor: recording ? 'var(--danger)' : 'var(--border-color)' }}
    >
      {micError ? (
        <div className="space-y-2">
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{t.micPermissionDenied}</p>
          <button className="btn-ghost text-xs" onClick={() => setMicError(null)}>{t.retry}</button>
        </div>
      ) : recording ? (
        <>
          <div className="relative">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)' }}>
              <div className="w-5 h-5 rounded-sm" style={{ background: 'var(--danger)' }} />
            </div>
            <div className="absolute inset-0 rounded-full animate-ping opacity-25"
              style={{ background: 'var(--danger)' }} />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {fmt(seconds)}
          </div>
          <button onClick={stop} className="btn-primary px-8 flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-white inline-block" />
            {t.stopRecording}
          </button>
        </>
      ) : (
        <>
          <MicIcon size={32} style={{ color: 'var(--accent)', opacity: 0.7 }} />
          <div>
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.voiceNote}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t.voiceNoteDesc}</div>
          </div>
          <button onClick={start} disabled={disabled} className="btn-primary flex items-center gap-2 px-6">
            <MicIcon size={15} /> {t.startRecording}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {t.orUploadFile}
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPTED_AUDIO} className="hidden"
            onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
        </>
      )}
    </div>
  )
}

function DropZone({ onFile, accept, label, icon, hint, disabled }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <label
      className={`card flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed transition-all duration-200 py-12 text-center ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      style={{ borderColor: dragging ? 'var(--accent)' : 'var(--border-color)' }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="mb-1 opacity-70">{icon}</div>
      <div>
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</div>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
    </label>
  )
}

export default function Upload() {
  const { lang } = useTheme()
  const t = T[lang]
  const [thinking, setThinking] = useState(false)
  const [thinkStep, setThinkStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const process = useCallback(async (file, uploadFn) => {
    setResult(null)
    setError(null)
    setThinking(true)
    setThinkStep(0)
    const steps = [1, 2, 3, 4]
    const timers = steps.map((s, i) => setTimeout(() => setThinkStep(s), (i + 1) * 1800))
    try {
      const data = await uploadFn(file)
      steps.forEach((_, i) => clearTimeout(timers[i]))
      setResult(data)
    } catch (e) {
      steps.forEach((_, i) => clearTimeout(timers[i]))
      setError(e.response?.data?.detail || e.message || 'Upload failed')
    } finally {
      setThinking(false)
    }
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.uploadTitle}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t.uploadDesc}</p>
      </div>

      {!thinking && !result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DropZone label={t.orderSlip} hint={t.orderSlipDesc} accept={ACCEPTED_IMAGE}
            icon={<ImageIcon size={32} style={{ color: 'var(--accent)' }} />}
            onFile={(f) => process(f, uploadImage)} />
          <DropZone label={t.shelfScan} hint={t.shelfScanDesc} accept={ACCEPTED_IMAGE}
            icon={<ImageIcon size={32} style={{ color: 'var(--accent)' }} />}
            onFile={(f) => process(f, uploadImage)} />
          <VoiceRecorder onFile={(f) => process(f, uploadAudio)} disabled={thinking} />
        </div>
      )}

      {thinking && <AgentThinking step={thinkStep} />}

      {error && (
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--danger) 40%, transparent)', background: 'color-mix(in srgb, var(--danger) 5%, transparent)' }}>
          <p className="text-sm" style={{ color: 'var(--danger)' }}>{t.error}: {error}</p>
          <button className="btn-ghost mt-3 flex items-center gap-2" onClick={() => setError(null)}>
            <RotateCcwIcon size={14} /> {t.retry}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--success) 30%, transparent)', background: 'color-mix(in srgb, var(--success) 5%, transparent)' }}>
            <div className="font-semibold mb-1" style={{ color: 'var(--success)' }}>{t.processingComplete}</div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.alerts_created} {t.alertsCreated} · Model: {result.model_used}</p>
          </div>
          <ReasoningPanel reasoning={result.reasoning} actions={result.actions_taken} model={result.model_used} />
          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => setResult(null)}>
            <UploadIcon size={16} /> {t.uploadAnother}
          </button>
        </div>
      )}
    </div>
  )
}
