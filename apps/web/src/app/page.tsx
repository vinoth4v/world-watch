import { signOutAction } from "@/app/actions"
import { auth } from "@/auth"
import { WorldMap } from "@/components/world-map"
import { listAlerts } from "@/db/alerts"
import { parseDateRange } from "@/lib/date-range"

// Reads the session cookie, so there is nothing to prerender.
export const dynamic = "force-dynamic"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  const range = parseDateRange(params)
  const alerts = await listAlerts(range)
  const filtered = Boolean(params.from || params.to)

  return (
    <main>
      <h1>World Watch</h1>
      <p>
        Signed in as <strong>{session?.user?.email ?? "unknown"}</strong>.
      </p>

      <form className="date-filter" method="get">
        <div>
          <label htmlFor="from">From</label>
          <input type="date" id="from" name="from" defaultValue={params.from ?? ""} />
        </div>
        <div>
          <label htmlFor="to">To</label>
          <input type="date" id="to" name="to" defaultValue={params.to ?? ""} />
        </div>
        <button type="submit">Filter</button>
      </form>

      <WorldMap alerts={alerts} />

      {alerts.length === 0 ? (
        <p>No alerts {filtered ? "in this range." : "yet."}</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <strong>{alert.title}</strong> — {alert.category} —{" "}
              <time dateTime={alert.occurredAt.toISOString()}>
                {alert.occurredAt.toISOString().slice(0, 10)}
              </time>
            </li>
          ))}
        </ul>
      )}

      <form action={signOutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  )
}
