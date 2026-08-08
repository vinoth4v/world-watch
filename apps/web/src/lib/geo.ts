export type LatLng = { lat: number; lng: number }

/**
 * Equirectangular projection: degrees to SVG user units on a 360x180
 * viewBox, so `x = lng + 180` and `y = 90 - lat` line up 1:1 with a
 * `<svg viewBox="0 0 360 180">`.
 */
export function project({ lat, lng }: LatLng): { x: number; y: number } {
  return { x: lng + 180, y: 90 - lat }
}
