import { describe, expect, it } from "vitest"
import type { DisruptionEventRow, SiteRow } from "../db/schema.ts"
import { DEFAULT_EXPOSURE_BUFFER_KM, exposedSites, haversineDistanceKm } from "./exposure.ts"

function event(overrides: Partial<DisruptionEventRow> = {}): DisruptionEventRow {
  return {
    id: "event-1",
    dedupeKey: "test:event-1",
    category: "natural_hazard",
    subtype: "earthquake",
    severity: 3,
    status: "active",
    title: "Test event",
    summary: null,
    region: null,
    latitude: 0,
    longitude: 0,
    geometryPrecision: "point",
    firstSeen: new Date("2026-08-01T00:00:00Z"),
    lastUpdated: new Date("2026-08-01T00:00:00Z"),
    confidence: "high",
    sources: [],
    ...overrides,
  }
}

function site(overrides: Partial<SiteRow> = {}): SiteRow {
  return {
    id: "site-1",
    name: "Test site",
    kind: "own_plant",
    tier: null,
    latitude: 0,
    longitude: 0,
    region: null,
    ...overrides,
  }
}

describe("haversineDistanceKm", () => {
  it("is zero for the same point", () => {
    expect(haversineDistanceKm({ latitude: 51.5, longitude: -0.1 }, { latitude: 51.5, longitude: -0.1 })).toBe(0)
  })

  it("matches a known distance, London to Paris, within 5km", () => {
    const london = { latitude: 51.5074, longitude: -0.1278 }
    const paris = { latitude: 48.8566, longitude: 2.3522 }
    expect(haversineDistanceKm(london, paris)).toBeGreaterThan(340)
    expect(haversineDistanceKm(london, paris)).toBeLessThan(350)
  })

  it("is symmetric", () => {
    const a = { latitude: 10, longitude: 20 }
    const b = { latitude: -5, longitude: 100 }
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a))
  })
})

describe("exposedSites", () => {
  it("flags a site inside the buffer and omits one outside it", () => {
    const nearby = site({ id: "near", latitude: 0.1, longitude: 0.1 })
    const far = site({ id: "far", latitude: 40, longitude: 40 })
    const quake = event({ latitude: 0, longitude: 0 })

    const result = exposedSites([quake], [nearby, far])

    expect(result).toHaveLength(1)
    const [exposure] = result
    expect(exposure?.site.id).toBe("near")
    expect(exposure?.impacts[0].event.id).toBe(quake.id)
  })

  it("ignores resolved events", () => {
    const nearby = site({ latitude: 0.1, longitude: 0.1 })
    const resolved = event({ status: "resolved" })

    expect(exposedSites([resolved], [nearby])).toHaveLength(0)
  })

  it("orders multiple exposed sites nearest first", () => {
    const near = site({ id: "near", latitude: 0.05, longitude: 0 })
    const mid = site({ id: "mid", latitude: 0.5, longitude: 0 })
    const quake = event({ latitude: 0, longitude: 0 })

    const result = exposedSites([quake], [mid, near], DEFAULT_EXPOSURE_BUFFER_KM)

    expect(result.map((r) => r.site.id)).toEqual(["near", "mid"])
  })

  it("respects a smaller buffer", () => {
    const nearby = site({ latitude: 0.5, longitude: 0 })
    const quake = event({ latitude: 0, longitude: 0 })

    expect(exposedSites([quake], [nearby], 10)).toHaveLength(0)
  })
})
