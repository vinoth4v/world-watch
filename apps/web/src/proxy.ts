import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

// Next 16 calls this convention "proxy"; it is what earlier versions called
// middleware, and it still runs before every matched request.
export default NextAuth(authConfig).auth

/**
 * This app is a public dashboard, which is a deliberate departure from the
 * template it came from.
 *
 * Werft apps are closed by default — every route requires the operator's
 * session because it exists, not because someone remembered. That is the right
 * default and it stays the template's. This app is the exception: the
 * disruption map is meant to be readable by anyone with the link, so the pages
 * are open.
 *
 * **What is still closed, and why.** `api/ingest` is a POST that fetches from
 * USGS and writes rows to this app's database. Public pages are a choice;
 * a public write endpoint is a liability — anyone with the URL could fill the
 * database or hammer USGS from this app's address. Reading is open, writing
 * needs the operator's session. Refreshing the data therefore still requires
 * signing in, which is why the login page remains.
 *
 * The inversion is the thing to be careful about: this matcher now lists what
 * is *protected* rather than what is exempt, so a new route is public unless
 * added here. A future route that writes anything must be added, and nothing
 * will remind you.
 */
export const config = {
  matcher: ["/api/ingest/:path*"],
}
