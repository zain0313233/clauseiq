import { test, expect } from "@playwright/test"

test.describe("access policy API", () => {
  test("returns public policy JSON", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:3000/api/access/policy")
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.policy?.usage).toContain("contract")
    expect(body.policy?.maxStrikes).toBeGreaterThan(0)
  })
})
