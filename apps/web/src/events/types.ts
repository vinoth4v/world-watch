/** The event taxonomy from the Global Disruption Map epic, v1. */
export const EVENT_CATEGORIES = [
  "natural_hazard",
  "security_incident",
  "conflict_geopolitical",
  "infrastructure_logistics",
  "labour_regulatory",
  "public_health",
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  natural_hazard: "Natural hazard",
  security_incident: "Security incident",
  conflict_geopolitical: "Conflict & geopolitical",
  infrastructure_logistics: "Infrastructure & logistics",
  labour_regulatory: "Labour & regulatory",
  public_health: "Public health",
}

export const EVENT_STATUSES = ["active", "resolved"] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export const EVENT_CONFIDENCE_LEVELS = ["low", "medium", "high"] as const
export type EventConfidence = (typeof EVENT_CONFIDENCE_LEVELS)[number]

/** 1 (minor) through 5 (severe) — coarse on purpose, no source agrees on a finer scale. */
export type EventSeverity = 1 | 2 | 3 | 4 | 5

export const SITE_KINDS = ["own_plant", "supplier_site"] as const
export type SiteKind = (typeof SITE_KINDS)[number]
