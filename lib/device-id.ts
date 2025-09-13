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
