export type DateRangeInput = { from?: string; to?: string }
export type DateRange = { from?: Date; to?: Date }

/**
 * Parses `from`/`to` query params (`YYYY-MM-DD`, from a `<input type="date">`)
 * into a UTC range. `to` is pushed to the end of that day so filtering is
 * inclusive of the whole day the operator picked, not just its midnight.
 * An unparseable value is dropped rather than thrown on — a malformed query
 * string should widen the results, not break the page.
 */
export function parseDateRange(input: DateRangeInput): DateRange {
  const from = parseDate(input.from)
  const to = parseDate(input.to)
  if (to) to.setUTCHours(23, 59, 59, 999)
  return { from, to }
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}
