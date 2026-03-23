import { useEffect, useRef, useState } from 'react'
import Quagga from '@ericblade/quagga2'

/**
 * Camera-based barcode scanner using Quagga2.
 * Renders a video stream and calls onDetected when a barcode is read.
 */
export function BarcodeScanner({ onDetected, onError, active = true, t }) {
  const containerRef = useRef(null)
  const onDetectedRef = useRef(onDetected)
  const [status, setStatus] = useState('idle') // idle | starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('')

  onDetectedRef.current = onDetected

  useEffect(() => {
    if (!active || !containerRef.current) return

    setStatus('starting')
    setErrorMsg('')

    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: containerRef.current,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency: 10,
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'upc_reader',
            'upc_e_reader',
            'code_128_reader',
            'code_39_reader',
            'codabar_reader',
          ],
        },
        locate: true,
      },
      (err) => {
        if (err) {
          setStatus('error')
          setErrorMsg(err.message || 'Camera access failed')
          onError?.(err)
          return
        }
        setStatus('scanning')
        Quagga.start()
      }
    )

    const onDetectedHandler = (result) => {
      const code = result?.codeResult?.code
      if (code) {
        Quagga.stop()
        onDetectedRef.current?.(code)
      }
    }

    Quagga.onDetected(onDetectedHandler)

    return () => {
      Quagga.offDetected(onDetectedHandler)
      try { Quagga.stop() } catch (_) { }
    }
  }, [active, onDetected, onError])

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', background: t?.bg3 || '#1e293b' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      {status === 'starting' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 14 }}>
          Starting camera...
        </div>
      )}
      {status === 'scanning' && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
          Position barcode in frame
        </div>
      )}
      {status === 'error' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', color: '#f87171', padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>Camera unavailable</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{errorMsg}</div>
        </div>
      )}
    </div>
  )
}
