export function buildGoogleDirectionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function buildAppleMapsUrl(latitude: number, longitude: number): string {
  return `http://maps.apple.com/?daddr=${latitude},${longitude}`;
}
