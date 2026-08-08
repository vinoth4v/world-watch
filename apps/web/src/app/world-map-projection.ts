export const MAP_WIDTH = 1000
export const MAP_HEIGHT = 500

/** Plain equirectangular projection: longitude and latitude map linearly onto the viewBox. */
export function project(latitude: number, longitude: number): { x: number; y: number } {
  return {
    x: ((longitude + 180) / 360) * MAP_WIDTH,
    y: ((90 - latitude) / 180) * MAP_HEIGHT,
  }
}
