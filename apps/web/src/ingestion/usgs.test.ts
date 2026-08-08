import { describe, expect, it } from "vitest"
import { mapUsgsFeatureToEvent, type UsgsFeature } from "./usgs.ts"

function feature(overrides: Partial<UsgsFeature["properties"]> = {}, id = "us7000abcd"): UsgsFeature {
  return {
    id,
    properties: {
      mag: 6.8,
      place: "120km SSE of Kokopo, Papua New Guinea",
      time: 1786300000000,
      updated: 1786300500000,
      url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
      title: "M 6.8 - 120km SSE of Kokopo, Papua New Guinea",
      ...overrides,
    },
    geometry: { type: "Point", coordinates: [152.4, -5.1, 35] },
  }
}

describe("mapUsgsFeatureToEvent", () => {
  it("maps the canonical fields", () => {
    const event = mapUsgsFeatureToEvent(feature())

    expect(event.dedupeKey).toBe("usgs:us7000abcd")
    expect(event.category).toBe("natural_hazard")
    expect(event.subtype).toBe("earthquake")
    expect(event.status).toBe("active")
    expect(event.confidence).toBe("high")
    expect(event.geometryPrecision).toBe("point")
    expect(event.latitude).toBe(-5.1)
    expect(event.longitude).toBe(152.4)
    expect(event.sources).toEqual([
      {
        name: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd",
        sourceEventId: "us7000abcd",
        reportedAt: new Date(1786300000000).toISOString(),
      },
    ])
  })

  it("scales severity with magnitude", () => {
    expect(mapUsgsFeatureToEvent(feature({ mag: 4.5 })).severity).toBe(1)
    expect(mapUsgsFeatureToEvent(feature({ mag: 6.1 })).severity).toBe(2)
    expect(mapUsgsFeatureToEvent(feature({ mag: 6.6 })).severity).toBe(3)
    expect(mapUsgsFeatureToEvent(feature({ mag: 7.2 })).severity).toBe(4)
    expect(mapUsgsFeatureToEvent(feature({ mag: 8.0 })).severity).toBe(5)
  })

  it("falls back gracefully when magnitude is missing", () => {
    const event = mapUsgsFeatureToEvent(feature({ mag: null }))
    expect(event.severity).toBe(1)
    expect(event.summary).toContain("unknown")
  })

  it("uses the feed's updated time for lastUpdated, not the original time", () => {
    const event = mapUsgsFeatureToEvent(feature())
    expect(event.lastUpdated).toEqual(new Date(1786300500000))
    expect(event.firstSeen).toEqual(new Date(1786300000000))
  })
})
