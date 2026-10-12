import { test, expect } from "@playwright/test";
test("public discovery remains usable before authentication", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your next journey",
  );
  await page.getByRole("textbox", { name: "From" }).fill("Nairobi");
  await page.getByRole("textbox", { name: "To" }).fill("Nakuru");
  await page.getByRole("button", { name: "Find a ride" }).click();
  await expect(page).toHaveURL(/\/rides\?/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Find your next ride",
  );
  expect(
    await page.locator('meta[name="viewport"]').getAttribute("content"),
  ).not.toContain("user-scalable=no");
});
test("support and account recovery are reachable", async ({ page }) => {
  await page.goto("/support");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Support");
  await page.goto("/account/recover");
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await page.goto("/dashboard/bookings");
  await expect(page).toHaveURL(/\/login/);
});
test("no horizontal scrolling at the target viewport", async ({ page }) => {
  await page.goto("/rides");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("verified passenger reserves, refreshes, and cancels without losing the booking", async ({
  page,
}, testInfo) => {
  const url = process.env.TEST_DATABASE_URL;
  test.skip(!url, "Requires an explicitly isolated TEST_DATABASE_URL");
  if (!new URL(url!).pathname.includes("test"))
    throw new Error("Browser fixtures require a test database");
  process.env.DATABASE_URL = url!;
  const { db } = await import("../../db");
  const { users, cars, journeys } = await import("../../db/schema");
  const { hash } = await import("bcryptjs");
  const suffix = crypto.randomUUID();
  const email = `passenger-${suffix}@test.invalid`;
  const password = "Browser-test-only-123!";
  const [driver, passenger] = await db
    .insert(users)
    .values([
      {
        name: "Browser Driver",
        email: `driver-${suffix}@test.invalid`,
        verified: true,
        emailVerified: new Date(),
        defaultRole: "driver",
      },
      {
        name: "Browser Passenger",
        email,
        passwordHash: await hash(password, 12),
        verified: true,
        emailVerified: new Date(),
        defaultRole: "passenger",
      },
    ])
    .returning();
  const [car] = await db
    .insert(cars)
    .values({
      driverId: driver.id,
      name: "Toyota Test",
      plateNumber: suffix.slice(0, 8),
      seats: 3,
      luggageCapacity: 20,
      verified: true,
    })
    .returning();
  const [ride] = await db
    .insert(journeys)
    .values({
      driverId: driver.id,
      carId: car.id,
      origin: "Nairobi",
      destination: "Nakuru",
      departureTime: new Date(Date.now() + 86400000),
      seatsAvailable: 3,
      luggageCapacity: 20,
      pricePerSeat: 800,
    })
    .returning();
  await page.goto(`/rides/${ride.id}`);
  await page.getByRole("link", { name: "Sign in to reserve" }).click();
  await page.getByLabel("Email Address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/rides/${ride.id}`));
  await page.getByRole("spinbutton", { name: "Seats" }).fill("2");
  await expect(page.getByText(/1,600\.00/).first()).toBeVisible();
  await page.getByLabel("M-Pesa phone number").fill("0712345678");
  await page.getByRole("button", { name: "Reserve and pay" }).click();
  await expect(page).toHaveURL(/\/dashboard\/bookings\/[a-f0-9-]+$/);
  await expect(
    page.getByRole("heading", { name: "payment pending", exact: true }),
  ).toBeVisible();
  const bookingUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(bookingUrl);
  await page.screenshot({
    path: testInfo.outputPath("booking-pending.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Cancel booking — full refund" })
    .click();
  await expect(
    page.getByRole("heading", { name: "cancelled", exact: true }),
  ).toBeVisible();
  await page.goto("/dashboard/admin/users");
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(passenger.verified).toBe(true);
});
