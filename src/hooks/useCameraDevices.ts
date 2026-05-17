import { useState, useEffect } from 'react'

export interface CameraDevice {
  deviceId: string
  label: string
}

export function useCameraDevices() {
  const [devices, setDevices] = useState<CameraDevice[]>([])

  useEffect(() => {
    const enumerate = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices()
        setDevices(
          all
            .filter(d => d.kind === 'videoinput')
            .map((d, i) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${i + 1}`,
            }))
        )
      } catch {
        setDevices([])
      }
    }

    enumerate()
    navigator.mediaDevices.addEventListener('devicechange', enumerate)
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerate)
  }, [])

  return devices
}
