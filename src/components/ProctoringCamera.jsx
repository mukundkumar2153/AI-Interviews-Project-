import React, { useEffect, useRef, useState } from 'react'
import { Camera, AlertTriangle, CheckCircle2 } from 'lucide-react'
import './ProctoringCamera.css'

// Loads face-api.js + models from CDN (no local model files needed)
let faceApiLoadPromise = null
function loadFaceApi() {
  if (faceApiLoadPromise) return faceApiLoadPromise
  faceApiLoadPromise = new Promise((resolve, reject) => {
    if (window.faceapi) return resolve(window.faceapi)
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
    script.onload = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models'
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        resolve(window.faceapi)
      } catch (e) { reject(e) }
    }
    script.onerror = reject
    document.body.appendChild(script)
  })
  return faceApiLoadPromise
}

export default function ProctoringCamera({ onViolation }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const [status, setStatus]   = useState('loading') // loading | ok | no-face | error
  const [violations, setViolations] = useState(0)

  useEffect(() => {
    let active = true
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 240, height: 180 } })
        if (!active) return
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream

        const faceapi = await loadFaceApi()
        if (!active) return

        intervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) return
          try {
            const result = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            if (result) {
              setStatus('ok')
            } else {
              setStatus('no-face')
              setViolations(v => {
                const nv = v + 1
                onViolation?.(nv)
                return nv
              })
            }
          } catch { /* ignore single-frame errors */ }
        }, 4000)
      } catch (err) {
        console.error('Camera/proctoring error:', err)
        setStatus('error')
      }
    }
    start()
    return () => {
      active = false
      clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="proctor-widget">
      <video ref={videoRef} autoPlay muted playsInline className="proctor-video" />
      <div className={`proctor-status ${status}`}>
        {status === 'loading' && <><Camera size={12} /> Starting camera…</>}
        {status === 'ok'      && <><CheckCircle2 size={12} /> Face detected</>}
        {status === 'no-face' && <><AlertTriangle size={12} /> No face detected!</>}
        {status === 'error'   && <><AlertTriangle size={12} /> Camera unavailable</>}
      </div>
      {violations > 0 && <div className="proctor-violations">⚠ {violations} violation{violations > 1 ? 's' : ''}</div>}
    </div>
  )
}