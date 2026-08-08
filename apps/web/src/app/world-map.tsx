import { CONTINENTS, type Continent } from "@/app/world-map-continents"
import { MAP_HEIGHT, MAP_WIDTH, project } from "@/app/world-map-projection"
import type { AlertRow } from "@/db/schema"

const MARKER_RADIUS: Record<AlertRow["severity"], number> = {
  low: 3,
  medium: 4,
  high: 5,
  critical: 6,
}

function continentPath(points: Continent["points"]): string {
  const commands = points.map(([lon, lat], i) => {
    const { x, y } = project(lat, lon)
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `${commands.join(" ")}Z`
}

export function WorldMap({ alerts }: { alerts: AlertRow[] }) {
  return (
    <svg
      className="world-map"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label={`World map with ${alerts.length} alert${alerts.length === 1 ? "" : "s"} plotted`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {CONTINENTS.map((continent) => (
        <path
          key={continent.name}
          className="world-map__land"
          d={continentPath(continent.points)}
        />
      ))}
      {alerts.map((alert) => {
        const { x, y } = project(alert.latitude, alert.longitude)
        return (
          <circle
            key={alert.id}
            className={`alert-marker severity--${alert.severity}`}
            cx={x}
            cy={y}
            r={MARKER_RADIUS[alert.severity]}
          >
            <title>
              {alert.title} — {alert.category.replace("_", " ")} ({alert.severity}),{" "}
              {alert.occurredAt.toISOString().slice(0, 10)}
            </title>
          </circle>
        )
      })}
    </svg>
  )
}
