"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, Loader2, ScanLine } from "lucide-react"

type Props = {
  onDetect: (imei: string) => void
}

export function IMEIScanner({ onDetect }: Props) {
  const [active, setActive] = useState(false)
  const [mode, setMode] = useState<"idle" | "starting" | "native" | "fallback">("idle")
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef(0)

  function stop() {
    setActive(false)
    setMode("idle")
    setError("")
    cancelAnimationFrame(frameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    if (!active) return
    let cancelled = false

    async function start() {
      setMode("starting")
      setError("")

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 } },
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        if (!cancelled) { setError("Camera access denied or unavailable"); setActive(false); setMode("idle") }
        return
      }

      if ("BarcodeDetector" in window) {
        setMode("native")
        const detector = new (window as any).BarcodeDetector({
          formats: ["code_128", "ean_13", "ean_8", "code_39", "itf", "codabar", "qr_code"],
        })

        async function scan() {
          if (!videoRef.current || cancelled) return
          try {
            const barcodes = await detector.detect(videoRef.current)
            for (const b of barcodes) {
              const raw = b.rawValue.replace(/\s/g, "")
              if (/^\d{8,18}$/.test(raw)) {
                onDetect(raw)
                stop()
                return
              }
            }
          } catch { /* frame skip */ }
          if (!cancelled) frameRef.current = requestAnimationFrame(scan)
        }
        scan()
      } else {
        setMode("fallback")
        const { Html5Qrcode } = await import("html5-qrcode")
        const el = document.getElementById("qr-reader")
        if (!el || cancelled) return

        const scanner = new Html5Qrcode("qr-reader")
        try {
          await scanner.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 300, height: 100 } },
            (decodedText) => {
              const raw = decodedText.replace(/\s/g, "")
              if (/^\d{8,18}$/.test(raw)) {
                onDetect(raw)
                scanner.stop().catch(() => {})
                stop()
              }
            },
            () => {}
          )
        } catch {
          if (!cancelled) { setError("Scanner failed to start") }
        }
      }
    }

    start()
    return () => { cancelled = true; stop() }
  }, [active])

  return (
    <div>
      {!active ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActive(true)}
          className="gap-1.5"
        >
          {mode === "starting" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ScanLine className="size-3.5" />
          )}
          Scan IMEI
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-40 object-cover"
            />
            {mode === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
            {mode !== "starting" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <ScanLine className="size-8 text-white/70 animate-pulse" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {mode === "native" ? (
                <><Camera className="size-3" /> Native scanner</>
              ) : mode === "fallback" ? (
                <><Camera className="size-3" /> JS scanner</>
              ) : (
                <><Loader2 className="size-3 animate-spin" /> Starting...</>
              )}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={stop} className="h-6 text-xs gap-1">
              <CameraOff className="size-3" />
              Cancel
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div id="qr-reader" className="hidden" />
        </div>
      )}
    </div>
  )
}
