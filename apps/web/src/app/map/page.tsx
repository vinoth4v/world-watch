import Link from "next/link"
import type { DisruptionEventRow } from "@/db/schema"
import { exposedSites } from "@/events/exposure"
import { getEvent, listEvents, listFeedIngestions, listSites } from "@/events/queries"
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/events/types"
import { refreshUsgsAction } from "./actions.ts"

// Reads the database on every request — there is no cached "map" to serve stale by accident.
export const dynamic = "force-dynamic"

const STALE_AFTER_MS = 60 * 60 * 1000

type SearchParams = {
  category?: string
  minSeverity?: string
  region?: string
  status?: string
  onlySites?: string
  event?: string
}

function mapHref(params: SearchParams, overrides: Partial<SearchParams>): string {
  const merged = { ...params, ...overrides }
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return query ? `/map?${query}` : "/map"
}

function severityClass(severity: DisruptionEventRow["severity"]): string {
  if (severity >= 4) return "severity-high"
  if (severity === 3) return "severity-medium"
  return "severity-low"
}

function categoryLabel(category: string): string {
  return EVENT_CATEGORY_LABELS[category as keyof typeof EVENT_CATEGORY_LABELS] ?? category
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const statusFilter = params.status ?? "active"
  const minSeverity = params.minSeverity ? Number(params.minSeverity) : undefined

  const [events, sites, feeds] = await Promise.all([
    listEvents({
      category: params.category || undefined,
      status: statusFilter || undefined,
      minSeverity,
      region: params.region || undefined,
    }),
    listSites(),
    listFeedIngestions(),
  ])

  const exposure = exposedSites(events, sites)
  const exposedEventIds = new Set(exposure.flatMap((site) => site.impacts.map((impact) => impact.event.id)))
  const visibleEvents = params.onlySites === "1" ? events.filter((event) => exposedEventIds.has(event.id)) : events

  let selectedEvent = params.event ? visibleEvents.find((event) => event.id === params.event) : undefined
  if (params.event && !selectedEvent) {
    selectedEvent = await getEvent(params.event)
  }

  const usgsFeed = feeds.find((feed) => feed.source === "usgs")
  const lastRefreshed = usgsFeed?.lastSuccessAt ?? null
  const isStale = !lastRefreshed || Date.now() - lastRefreshed.getTime() > STALE_AFTER_MS

  return (
    <main className="wide">
      <p>
        <Link href="/">&larr; Home</Link>
      </p>
      <h1>Global disruption map</h1>
      <p className="page-note">
        List view for now, not a rendered map — plotting event geometry needs a mapping library, and
        none is on the blessed dependency list yet. See the PR description for the options.
      </p>

      <section aria-label="Feed status">
        <p>
          USGS earthquakes:{" "}
          {lastRefreshed ? (
            <span className={isStale ? "status-stale" : "status-fresh"}>
              last refreshed {lastRefreshed.toISOString()}
              {isStale ? " — stale" : ""}
            </span>
          ) : (
            <span className="status-stale">never ingested</span>
          )}
          {usgsFeed?.lastError ? <span role="alert"> failing: {usgsFeed.lastError}</span> : null}
        </p>
        <form action={refreshUsgsAction}>
          <button type="submit">Refresh USGS now</button>
        </form>
      </section>

      <form method="get" className="filters">
        <p>
          <label htmlFor="category">Category</label>
          <br />
          <select id="category" name="category" defaultValue={params.category ?? ""}>
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {EVENT_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="minSeverity">Minimum severity</label>
          <br />
          <select id="minSeverity" name="minSeverity" defaultValue={params.minSeverity ?? ""}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {level}+
              </option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="region">Region contains</label>
          <br />
          <input id="region" name="region" type="text" defaultValue={params.region ?? ""} />
        </p>
        <p>
          <label htmlFor="status">Status</label>
          <br />
          <select id="status" name="status" defaultValue={statusFilter}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </p>
        <p>
          <label htmlFor="onlySites">
            <input
              id="onlySites"
              name="onlySites"
              type="checkbox"
              value="1"
              defaultChecked={params.onlySites === "1"}
            />{" "}
            Only events affecting my sites
          </label>
        </p>
        <p>
          <button type="submit">Apply filters</button> <Link href="/map">Clear</Link>
        </p>
      </form>

      <section aria-label="Exposed sites">
        <h2>Exposed sites ({exposure.length})</h2>
        {exposure.length === 0 ? (
          <p>No sites within the exposure buffer of an active, filtered-in event.</p>
        ) : (
          <ul>
            {exposure.map(({ site, impacts }) => (
              <li key={site.id}>
                <strong>{site.name}</strong> ({site.kind.replace("_", " ")}) — nearest event{" "}
                {Math.round(impacts[0].distanceKm)}km away
                <ul>
                  {impacts.map(({ event, distanceKm }) => (
                    <li key={event.id}>
                      <Link href={mapHref(params, { event: event.id })}>{event.title}</Link> —{" "}
                      {Math.round(distanceKm)}km, severity {event.severity}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Events">
        <h2>Events ({visibleEvents.length})</h2>
        {visibleEvents.length === 0 ? (
          <p>No events match the current filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Category</th>
                <th>Title</th>
                <th>Region</th>
                <th>First seen</th>
              </tr>
            </thead>
            <tbody>
              {visibleEvents.map((event) => (
                <tr key={event.id} className={severityClass(event.severity)}>
                  <td>{event.severity}</td>
                  <td>{categoryLabel(event.category)}</td>
                  <td>
                    <Link href={mapHref(params, { event: event.id })}>{event.title}</Link>
                  </td>
                  <td>{event.region ?? "—"}</td>
                  <td>{event.firstSeen.toISOString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedEvent ? (
        <section aria-label="Event detail">
          <h2>{selectedEvent.title}</h2>
          <dl className="detail">
            <dt>Category</dt>
            <dd>
              {categoryLabel(selectedEvent.category)} / {selectedEvent.subtype}
            </dd>
            <dt>Severity</dt>
            <dd>{selectedEvent.severity} / 5</dd>
            <dt>Status</dt>
            <dd>{selectedEvent.status}</dd>
            <dt>First detected</dt>
            <dd>{selectedEvent.firstSeen.toISOString()}</dd>
            <dt>Last updated</dt>
            <dd>{selectedEvent.lastUpdated.toISOString()}</dd>
            <dt>Affected geography</dt>
            <dd>
              {selectedEvent.region ?? "—"} ({selectedEvent.latitude.toFixed(2)},{" "}
              {selectedEvent.longitude.toFixed(2)}, {selectedEvent.geometryPrecision})
            </dd>
            <dt>Summary</dt>
            <dd>{selectedEvent.summary ?? "—"}</dd>
            <dt>Confidence</dt>
            <dd>{selectedEvent.confidence}</dd>
            <dt>Sources</dt>
            <dd>
              <ul>
                {selectedEvent.sources.map((source) => (
                  <li key={source.sourceEventId}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.name}
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </dl>
        </section>
      ) : null}
    </main>
  )
}
