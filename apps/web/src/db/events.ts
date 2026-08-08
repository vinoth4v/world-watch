import { db } from "@/db/client"
import { auditLog } from "@/db/schema"

export type AuditKind = string

/**
 * Write an audit row, swallowing failures.
 *
 * Auditing is observability, not correctness: an unreachable database must
 * never be able to lock the only operator out of their own app.
 */
export async function recordEvent(
  kind: AuditKind,
  actor: string | null,
  detail?: string,
): Promise<void> {
  try {
    await db()
      .insert(auditLog)
      .values({ kind, actor, detail: detail ?? null })
  } catch (error) {
    console.error(`audit_log write failed for "${kind}"`, error)
  }
}
