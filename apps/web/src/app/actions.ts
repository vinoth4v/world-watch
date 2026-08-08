"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { signOut } from "@/auth"
import { createAlert } from "@/db/alerts"
import { alertCategories, alertSeverities } from "@/db/schema"

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" })
}

const newAlertSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.enum(alertCategories),
  severity: z.enum(alertSeverities),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  occurredAt: z.string().min(1),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
  sourceUrl: z.string().trim().url().optional().or(z.literal("")),
  redirectTo: z.string().startsWith("/").optional(),
})

/**
 * There is no ingestion pipeline yet, so this is how an alert gets onto the
 * map: the operator enters it by hand. `redirectTo` carries the current date
 * filter back through so adding an alert doesn't reset it.
 */
export async function createAlertAction(formData: FormData): Promise<void> {
  const parsed = newAlertSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    severity: formData.get("severity"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    occurredAt: formData.get("occurredAt"),
    summary: formData.get("summary") ?? undefined,
    sourceUrl: formData.get("sourceUrl") ?? undefined,
    redirectTo: formData.get("redirectTo") || undefined,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "))
  }

  const { redirectTo, occurredAt, summary, sourceUrl, ...rest } = parsed.data

  await createAlert({
    ...rest,
    occurredAt: new Date(occurredAt),
    summary: summary || null,
    sourceUrl: sourceUrl || null,
  })

  redirect(redirectTo || "/")
}
