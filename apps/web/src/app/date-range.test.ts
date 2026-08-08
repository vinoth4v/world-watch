import { describe, expect, it } from "vitest"
import { parseDateRange } from "./date-range.ts"

describe("parseDateRange", () => {
  it("returns an empty range when nothing is given", () => {
    expect(parseDateRange({})).toEqual({ from: undefined, to: undefined })
  })

  it("parses a from date at the start of that day", () => {
    const { from } = parseDateRange({ from: "2026-01-15" })
    expect(from?.toISOString()).toBe("2026-01-15T00:00:00.000Z")
  })

  it("parses a to date at the end of that day", () => {
    const { to } = parseDateRange({ to: "2026-01-15" })
    expect(to?.toISOString()).toBe("2026-01-15T23:59:59.999Z")
  })

  it("rejects a from date after the to date", () => {
    expect(parseDateRange({ from: "2026-02-01", to: "2026-01-01" }).error).toBeTruthy()
  })

  it("accepts a from date equal to the to date", () => {
    const range = parseDateRange({ from: "2026-01-15", to: "2026-01-15" })
    expect(range.error).toBeUndefined()
  })

  it("rejects malformed dates instead of throwing", () => {
    for (const value of ["not-a-date", "26-01-15", "2026/01/15"]) {
      expect(parseDateRange({ from: value }).error, value).toBeTruthy()
    }
  })

  it("treats an empty string like no filter", () => {
    expect(parseDateRange({ from: "" }).error).toBeUndefined()
  })
})
