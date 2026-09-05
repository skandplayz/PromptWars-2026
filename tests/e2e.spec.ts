import { test, expect, type Page } from "@playwright/test";

// Critical journey with /api/* mocked. Selecting a project must render from the
// already-generated data — no second Gemini call, no /api/plan request.

const BLUEPRINT = {
  problemStatement: "Farms waste water due to manual irrigation.",
  solution: "IoT sensors automate watering based on soil moisture.",
  whyThisProject: "Directly uses your IoT and Python experience.",
  features: ["Live sensor dashboard", "Automated valve control"],
  techStack: ["Python", "MQTT", "React"],
  developmentRoadmap: ["Week 1: hardware setup", "Week 2: backend"],
  testingStrategy: ["Unit test sensor parsing", "Integration test valve control"],
  futureScope: ["ML-based watering prediction"],
  estimatedTimeline: "3 months",
};

const PROJECT = {
  title: "Smart Irrigation System",
  shortDescription: "A solo-friendly IoT project that automates farm watering on a budget.",
  problem: "Farms waste water",
  solution: "IoT soil sensors control valves",
  whyItFits: "Matches your IoT and Python skills",
  difficulty: "Intermediate",
  estimatedTimeline: "3 months",
  techStack: ["Python", "MQTT", "React"],
  coreFeatures: ["Sensor dashboard", "Automated valves"],
  blueprint: BLUEPRINT,
};

const PROJECTS = {
  projects: [
    PROJECT,
    { ...PROJECT, title: "Second Project" },
    { ...PROJECT, title: "Third Project" },
  ],
};

const BLUEPRINT_SHORTER = { ...BLUEPRINT, estimatedTimeline: "6 weeks" };

async function mockApis(page: Page): Promise<{ planCalled: () => boolean }> {
  let planHit = false;
  await page.route("**/api/plan", (r) => {
    planHit = true;
    return r.fulfill({ status: 404, json: { error: "gone" } });
  });
  await page.route("**/api/ideas", (r) => r.fulfill({ json: PROJECTS }));
  await page.route("**/api/refine", (r) => r.fulfill({ json: BLUEPRINT_SHORTER }));
  return { planCalled: () => planHit };
}

test("critical journey: profile -> projects -> blueprint -> refine (one Gemini call)", async ({ page }) => {
  const { planCalled } = await mockApis(page);
  await page.goto("/");

  await page.getByLabel(/Interests/).fill("IoT, agriculture");
  await page.getByLabel(/Current skills/).fill("Python, React");
  await page.getByLabel(/Preferred domain/).fill("IoT");
  await page.getByLabel(/Difficulty/).selectOption("Intermediate");
  await page.getByRole("button", { name: /Generate project ideas/ }).click();

  await expect(page.getByRole("heading", { name: /Three projects for you/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Smart Irrigation System" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Third Project" })).toBeVisible();

  // Selecting a project renders the local blueprint — no network round-trip.
  await page.getByRole("button", { name: /View project/ }).first().click();

  await expect(page.getByRole("heading", { name: "Smart Irrigation System", level: 2 })).toBeVisible();
  await expect(page.getByText("Build roadmap")).toBeVisible();
  await expect(page.getByText("Week 1: hardware setup")).toBeVisible();
  await expect(page.getByText("3 months").first()).toBeVisible();

  // Critical: opening the blueprint must not call the (removed) plan endpoint.
  expect(planCalled()).toBe(false);

  await page.getByRole("button", { name: "Shorten timeline" }).click();
  await expect(page.getByText("6 weeks").first()).toBeVisible();
});

test("validation error surfaces to the user", async ({ page }) => {
  await page.route("**/api/ideas", (r) =>
    r.fulfill({ status: 400, json: { error: "Interests are required" } }),
  );
  await page.goto("/");

  await page.getByLabel(/Interests/).fill("x");
  await page.getByLabel(/Current skills/).fill("y");
  await page.getByLabel(/Preferred domain/).fill("z");
  await page.getByRole("button", { name: /Generate project ideas/ }).click();

  await expect(page.locator(".error")).toContainText("Interests are required");
});
