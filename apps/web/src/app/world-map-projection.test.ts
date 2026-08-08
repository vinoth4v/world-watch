import { describe, expect, it } from "vitest"
import { MAP_HEIGHT, MAP_WIDTH, project } from "./world-map-projection.ts"

describe("project", () => {
  it("puts the null island at the centre", () => {
    expect(project(0, 0)).toEqual({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 })
  })

  it("puts the north-west corner of the map at (0, 0)", () => {
    expect(project(90, -180)).toEqual({ x: 0, y: 0 })
  })

  it("puts the south-east corner of the map at (width, height)", () => {
    expect(project(-90, 180)).toEqual({ x: MAP_WIDTH, y: MAP_HEIGHT })
  })
})
