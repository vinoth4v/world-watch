export type DateRangeInput = {
  from?: string | null
  to?: string | null
}

export type ParsedDateRange = {
  from?: Date
  to?: Date
  error?: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parses `from`/`to` query params — the format `<input type="date">`
 * produces — into a Date range. `to` is treated as inclusive of the whole
 * day, since a user picking "2026-08-08" as an end date means through the
 * end of that day, not midnight at its start.
 */
export function parseDateRange(input: DateRangeInput): ParsedDateRange {
  const from = parseDateParam(input.from)
  if (from.error) return { error: from.error }

  const to = parseDateParam(input.to, { endOfDay: true })
  if (to.error) return { error: to.error }

  if (from.date && to.date && from.date > to.date) {
    return { error: '"from" must not be after "to".' }
  }

  return { from: from.date, to: to.date }
}

function parseDateParam(
  value: string | null | undefined,
  opts: { endOfDay?: boolean } = {},
): { date?: Date; error?: string } {
  if (!value) return {}

  if (!DATE_PATTERN.test(value)) {
    return { error: `"${value}" is not a valid date.` }
  }

  const date = new Date(`${value}T${opts.endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`)
  if (Number.isNaN(date.getTime())) {
    return { error: `"${value}" is not a valid date.` }
  }

  return { date }
}
