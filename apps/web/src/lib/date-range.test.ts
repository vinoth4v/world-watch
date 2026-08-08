import { describe, expect, it } from "vitest"
import { parseDateRange } from "./date-range.ts"

describe("parseDateRange", () => {
  it("returns an empty range for no input", () => {
    expect(parseDateRange({})).toEqual({ from: undefined, to: undefined })
  })

  it("parses a from date at the start of that UTC day", () => {
    const { from } = parseDateRange({ from: "2026-03-01" })
    expect(from?.toISOString()).toBe("2026-03-01T00:00:00.000Z")
  })

  it("parses a to date at the end of that UTC day, so the whole day is included", () => {
    const { to } = parseDateRange({ to: "2026-03-01" })
    expect(to?.toISOString()).toBe("2026-03-01T23:59:59.999Z")
  })

  it("drops unparseable values instead of throwing", () => {
    expect(parseDateRange({ from: "not-a-date", to: "also-not-a-date" })).toEqual({
      from: undefined,
      to: undefined,
    })
  })
})
