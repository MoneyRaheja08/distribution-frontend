// Best-effort browser geolocation; resolves to {lat,lng} or null (never rejects).
export function getPosition(timeout = 8000) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    )
  })
}
