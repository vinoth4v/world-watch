import { redirect } from "next/navigation"

/**
 * The app lives at `/`.
 *
 * This page used to be the template's placeholder — "replace this page with the
 * app you actually meant to build" — with a link to the real dashboard beneath
 * it. So the production URL showed a placeholder and a link, which reads as
 * nothing having been built, and made the operator click past a welcome page to
 * reach their own app.
 *
 * The dashboard keeps its own address because it is a real route with its own
 * server actions and search params; `/` redirects to it rather than duplicating
 * it. AGENTS.md permits exactly this shape and forbids the link.
 */
export default function HomePage() {
  redirect("/map")
}
