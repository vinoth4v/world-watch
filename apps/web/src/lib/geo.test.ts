import { describe, expect, it } from "vitest"
import { project } from "./geo.ts"

describe("project", () => {
  it("maps the origin to the centre of the viewBox", () => {
    expect(project({ lat: 0, lng: 0 })).toEqual({ x: 180, y: 90 })
  })

  it("maps the north-west corner to the SVG origin", () => {
    expect(project({ lat: 90, lng: -180 })).toEqual({ x: 0, y: 0 })
  })

  it("maps the south-east corner to the far edge", () => {
    expect(project({ lat: -90, lng: 180 })).toEqual({ x: 360, y: 180 })
  })
})
