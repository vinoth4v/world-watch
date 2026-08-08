import { expect, test } from "@playwright/test"

test("a visitor reaches the app directly, with no login gate", async ({ page }) => {
  await page.goto("/")

  await expect(page).toHaveURL("/")
  await expect(page.getByText("Replace this page")).toBeVisible()
})

test("the home page is styled by the token stylesheet", async ({ page }) => {
  await page.goto("/")

  // Proves the generated CSS was built and served — a missing dist/tokens.css
  // leaves this custom property undefined.
  const background = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim(),
  )

  expect(background).not.toBe("")
})
