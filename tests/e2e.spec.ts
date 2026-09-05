import { test, expect, type Page } from "@playwright/test";

// Critical journey with all /api/* routes mocked.

const IDEA = {
  title: "Smart Irrigation System",
  problem: "Farms waste water",
  solution: "IoT soil sensors control valves",
  whyItFits: "Matches your IoT and Python skills",
  difficulty: "Intermediate",
  estimatedTimeline: "3 months",
  techStack: ["Python", "MQTT", "React"],
  coreFeatures: ["Sensor dashboard", "Automated valves"],
};

const PLAN = {
  projectTitle: "Smart Irrigation System",
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

const PLAN_SHORTER = { ...PLAN, estimatedTimeline: "6 weeks" };

async function mockApis(page: Page) {
  await page.route("**/api/ideas", (r) =>
    r.fulfill({ json: { ideas: [IDEA, { ...IDEA, title: "Second Idea" }] } }),
  );
  await page.route("**/api/plan", (r) => r.fulfill({ json: PLAN }));
  await page.route("**/api/refine", (r) => r.fulfill({ json: PLAN_SHORTER }));
}

test("critical journey: profile -> ideas -> plan -> refine", async ({ page }) => {
  await mockApis(page);
  await page.goto("/");

  await page.getByLabel(/Interests/).fill("IoT, agriculture");
  await page.getByLabel(/Current skills/).fill("Python, React");
  await page.getByLabel(/Preferred domain/).fill("IoT");
  await page.getByLabel(/Difficulty/).selectOption("Intermediate");
  await page.getByRole("button", { name: /Generate project ideas/ }).click();

  await expect(page.getByRole("heading", { name: /Tailored ideas/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Smart Irrigation System" })).toBeVisible();

  await page.getByRole("button", { name: /Get mentorship plan/ }).first().click();

  await expect(page.getByRole("heading", { name: "Smart Irrigation System", level: 2 })).toBeVisible();
  await expect(page.getByText("Development roadmap")).toBeVisible();
  await expect(page.getByText("Week 1: hardware setup")).toBeVisible();
  // Timeline appears in both the plan header and the "At a glance" rail.
  await expect(page.getByText("3 months").first()).toBeVisible();

  await page.getByRole("button", { name: "Fit a shorter timeline" }).click();
  await expect(page.getByText("6 weeks").first()).toBeVisible();
});

test("validation error surfaces to the user", async ({ page }) => {
  await page.route("**/api/ideas", (r) =>
    r.fulfill({ status: 400, json: { error: "Interests are required" } }),
  );
  await page.goto("/");

  // Bypass native required validation to exercise the server error path.
  await page.getByLabel(/Interests/).fill("x");
  await page.getByLabel(/Current skills/).fill("y");
  await page.getByLabel(/Preferred domain/).fill("z");
  await page.getByRole("button", { name: /Generate project ideas/ }).click();

  await expect(page.locator(".error")).toContainText("Interests are required");
});
