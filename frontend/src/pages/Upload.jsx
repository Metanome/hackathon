import { useState, useRef, useCallback } from 'react'
import { uploadImage, uploadAudio } from '../api/upload'
import AgentThinking from '../components/AgentThinking'
import ReasoningPanel from '../components/ReasoningPanel'

const ACCEPTED_IMAGE = 'image/jpeg,image/png,image/webp'
const ACCEPTED_AUDIO = 'audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/webm'

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
      className={`card flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed
        transition-all duration-200 py-12 text-center
        ${dragging ? 'border-teal-400 bg-teal-900/20' : 'border-slate-700 hover:border-slate-500'}
        ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div>
        <div className="text-slate-200 font-semibold">{label}</div>
        <div className="text-xs text-slate-500 mt-1">{hint}</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]) }}
      />
    </label>
  )
}

export default function Upload() {
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
    const timers = steps.map((s, i) =>
      setTimeout(() => setThinkStep(s), (i + 1) * 1800)
    )

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
        <h1 className="text-2xl font-bold text-slate-100">Upload</h1>
        <p className="text-slate-500 text-sm mt-1">
          Drop an order slip, shelf photo, or voice note - the agent handles the rest.
        </p>
      </div>

      {!thinking && !result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DropZone
            label="Order Slip"
            hint="JPG, PNG, or WEBP - handwritten or printed"
            accept={ACCEPTED_IMAGE}
            onFile={(f) => process(f, uploadImage)}
          />
          <DropZone
            label="Shelf Scan"
            hint="Photo of your storage shelf or product display"
            accept={ACCEPTED_IMAGE}
            onFile={(f) => process(f, uploadImage)}
          />
          <DropZone
            label="Voice Note"
            hint="WAV, MP3, or M4A - speak in Turkish or English"
            accept={ACCEPTED_AUDIO}
            onFile={(f) => process(f, uploadAudio)}
          />
        </div>
      )}

      {thinking && <AgentThinking step={thinkStep} />}

      {error && (
        <div className="card border-red-500/40 bg-red-950/20">
          <p className="text-red-400 text-sm">Error: {error}</p>
          <button className="btn-ghost mt-3" onClick={() => setError(null)}>Try again</button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="card border-green-500/30 bg-green-950/10">
            <div className="text-green-400 font-semibold mb-1">Processing complete</div>
            <p className="text-xs text-slate-500">{result.alerts_created} alert(s) created · Model: {result.model_used}</p>
          </div>
          <ReasoningPanel
            reasoning={result.reasoning}
            actions={result.actions_taken}
            model={result.model_used}
          />
          <button className="btn-primary w-full" onClick={() => setResult(null)}>
            Upload Another
          </button>
        </div>
      )}
    </div>
  )
}
