import { expect, test } from "@playwright/test"

test("the dashboard is readable without signing in", async ({ page }) => {
  // This app is deliberately public — see apps/web/src/proxy.ts. The template's
  // default is the opposite, so this test exists to make the departure explicit
  // rather than letting a future change quietly restore the gate.
  await page.goto("/")

  await expect(page).not.toHaveURL(/\/login/)
  // `/` is the app, not a welcome page: it lands on the dashboard itself.
  await expect(page).toHaveURL(/\/map/)
  await expect(page.getByRole("heading", { name: /disruption map/i })).toBeVisible()
})

test("writing still requires the operator, even though reading does not", async ({ request }) => {
  // The one route that must stay closed: it fetches from USGS and writes rows.
  // A public read surface is a choice; a public write endpoint is a liability.
  const response = await request.post("/api/ingest/usgs", { maxRedirects: 0 })

  expect([302, 307, 401, 403]).toContain(response.status())
})


test("the login page is styled by the token stylesheet", async ({ page }) => {
  await page.goto("/login")

  // Proves the generated CSS was built and served — a missing dist/tokens.css
  // leaves this custom property undefined.
  const background = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim(),
  )

  expect(background).not.toBe("")
})
