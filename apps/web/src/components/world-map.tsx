import type { AlertRow } from "@/db/schema"
import { project } from "@/lib/geo"

/**
 * Stylised continent outlines, not surveyed coastline data — a handful of
 * points per landmass, enough to read as "world map" at a glance. Precise
 * coastlines are a separate decision (a geo/topojson dependency isn't on the
 * blessed list yet; see AGENTS.md).
 */
const CONTINENTS: { name: string; outline: [lng: number, lat: number][] }[] = [
  {
    name: "North America",
    outline: [
      [-165, 68],
      [-95, 72],
      [-70, 50],
      [-80, 25],
      [-97, 18],
      [-117, 32],
      [-124, 49],
      [-140, 60],
    ],
  },
  {
    name: "South America",
    outline: [
      [-77, 10],
      [-35, -8],
      [-58, -35],
      [-70, -55],
      [-75, -30],
      [-81, -5],
    ],
  },
  {
    name: "Africa",
    outline: [
      [-17, 20],
      [-10, 5],
      [12, 4],
      [18, -34],
      [35, -25],
      [51, 12],
      [37, 20],
      [10, 37],
    ],
  },
  {
    name: "Europe",
    outline: [
      [-9, 43],
      [0, 51],
      [20, 60],
      [40, 66],
      [20, 40],
      [-5, 36],
    ],
  },
  {
    name: "Asia",
    outline: [
      [30, 55],
      [60, 55],
      [90, 60],
      [120, 60],
      [140, 50],
      [120, 25],
      [100, 8],
      [75, 10],
      [50, 15],
      [35, 25],
    ],
  },
  {
    name: "Australia",
    outline: [
      [113, -22],
      [130, -12],
      [153, -28],
      [145, -38],
      [125, -34],
    ],
  },
]

const MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150]
const PARALLELS = [-60, -30, 0, 30, 60]

function outlinePath(outline: [number, number][]): string {
  return `${outline
    .map(([lng, lat], i) => {
      const { x, y } = project({ lat, lng })
      return `${i === 0 ? "M" : "L"}${x},${y}`
    })
    .join(" ")} Z`
}

export function WorldMap({ alerts }: { alerts: AlertRow[] }) {
  return (
    <svg
      viewBox="0 0 360 180"
      role="img"
      aria-label={`World map, ${alerts.length} alert${alerts.length === 1 ? "" : "s"} shown`}
      className="world-map"
    >
      <rect x={0} y={0} width={360} height={180} className="world-map__ocean" />
      {MERIDIANS.map((lng) => {
        const { x } = project({ lat: 0, lng })
        return <line key={lng} x1={x} y1={0} x2={x} y2={180} className="world-map__graticule" />
      })}
      {PARALLELS.map((lat) => {
        const { y } = project({ lat, lng: 0 })
        return <line key={lat} x1={0} y1={y} x2={360} y2={y} className="world-map__graticule" />
      })}
      {CONTINENTS.map((continent) => (
        <path key={continent.name} d={outlinePath(continent.outline)} className="world-map__land">
          <title>{continent.name}</title>
        </path>
      ))}
      {alerts.map((alert) => {
        const { x, y } = project({ lat: alert.latitude, lng: alert.longitude })
        return (
          <circle key={alert.id} cx={x} cy={y} r={2.5} className="world-map__marker">
            <title>{`${alert.title} (${alert.category})`}</title>
          </circle>
        )
      })}
    </svg>
  )
}
