// Utility to generate and manage device IDs for anonymous rating
export function getDeviceId(): string {
  if (typeof window === "undefined") return ""

  let deviceId = localStorage.getItem("ratingz_device_id")

  if (!deviceId) {
    deviceId = "device_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
    localStorage.setItem("ratingz_device_id", deviceId)
  }

  return deviceId
}

// Get user's IP address for network-based rating restrictions
export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch (error) {
    console.error('Failed to get IP address:', error)
    return 'unknown'
  }
}

// Generate a network fingerprint for additional restriction
export function getNetworkFingerprint(): string {
  if (typeof window === "undefined") return ""
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Network fingerprint', 2, 2)
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|')
  
  // Create a simple hash
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return 'fp_' + Math.abs(hash).toString(36)
}
