import { createAlertAction, signOutAction } from "@/app/actions"
import { parseDateRange } from "@/app/date-range"
import { WorldMap } from "@/app/world-map"
import { auth } from "@/auth"
import { listAlerts } from "@/db/alerts"
import { alertCategories, alertSeverities } from "@/db/schema"

// Reads the session cookie and the database, so there is nothing to prerender.
export const dynamic = "force-dynamic"

type SearchParams = { from?: string; to?: string }

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  const { from: fromParam, to: toParam } = await searchParams
  const range = parseDateRange({ from: fromParam, to: toParam })
  const alerts = range.error ? [] : await listAlerts(range)

  const filterParams = new URLSearchParams()
  if (fromParam) filterParams.set("from", fromParam)
  if (toParam) filterParams.set("to", toParam)
  const filterQuery = filterParams.toString()
  const redirectTo = filterQuery ? `/?${filterQuery}` : "/"

  return (
    <main className="dashboard">
      <h1>World Watch</h1>
      <p>
        Signed in as <strong>{session?.user?.email ?? "unknown"}</strong>.
      </p>
      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>

      <form className="filter-form" action="/">
        <div>
          <label htmlFor="from">From</label>
          <input id="from" name="from" type="date" defaultValue={fromParam ?? ""} />
        </div>
        <div>
          <label htmlFor="to">To</label>
          <input id="to" name="to" type="date" defaultValue={toParam ?? ""} />
        </div>
        <div>
          <button type="submit">Filter</button>
        </div>
        {(fromParam || toParam) && <a href="/">Clear</a>}
      </form>

      {range.error ? <p role="alert">{range.error}</p> : null}

      <WorldMap alerts={alerts} />

      {alerts.length === 0 && !range.error ? (
        <p>No alerts in this range yet. Add one below.</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <span className={`severity-dot severity--${alert.severity}`} />
              <strong>{alert.title}</strong>
              <div className="meta">
                {alert.category.replace("_", " ")} · {alert.severity} ·{" "}
                {alert.occurredAt.toISOString().slice(0, 10)} · {alert.latitude.toFixed(2)},{" "}
                {alert.longitude.toFixed(2)}
              </div>
              {alert.summary ? <p>{alert.summary}</p> : null}
              {alert.sourceUrl ? (
                <a href={alert.sourceUrl} target="_blank" rel="noreferrer">
                  Source
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h2>Report an alert</h2>
      <form className="add-alert-form" action={createAlertAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" required maxLength={200} />
        </div>
        <div className="row">
          <div>
            <label htmlFor="category">Category</label>
            <select id="category" name="category" required defaultValue="natural_hazard">
              {alertCategories.map((category) => (
                <option key={category} value={category}>
                  {category.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="severity">Severity</label>
            <select id="severity" name="severity" required defaultValue="medium">
              {alertSeverities.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div>
            <label htmlFor="latitude">Latitude</label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              required
            />
          </div>
          <div>
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="occurredAt">Occurred at</label>
          <input id="occurredAt" name="occurredAt" type="datetime-local" required />
        </div>
        <div>
          <label htmlFor="summary">Summary</label>
          <textarea id="summary" name="summary" rows={3} maxLength={2000} />
        </div>
        <div>
          <label htmlFor="sourceUrl">Source URL</label>
          <input id="sourceUrl" name="sourceUrl" type="url" />
        </div>
        <div>
          <button type="submit">Add alert</button>
        </div>
      </form>
    </main>
  )
}
