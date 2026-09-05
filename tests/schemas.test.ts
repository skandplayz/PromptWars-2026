import { test, expect } from "@playwright/test";
import {
  profileSchema,
  projectSchema,
  projectsResponseSchema,
  blueprintSchema,
  refineRequestSchema,
} from "../lib/schemas";

const validBlueprint = {
  problemStatement: "Water waste",
  solution: "IoT control",
  whyThisProject: "Fits skills",
  features: ["Dashboard"],
  techStack: ["Python"],
  developmentRoadmap: ["Week 1: setup"],
  testingStrategy: ["Unit tests"],
  futureScope: ["ML prediction"],
  estimatedTimeline: "3 months",
};

const validProject = {
  title: "Smart Irrigation",
  shortDescription: "A solo-friendly IoT project that automates farm watering.",
  problem: "Water waste in farms",
  solution: "IoT soil sensors + control",
  whyItFits: "Matches IoT + Python skills",
  difficulty: "Intermediate",
  estimatedTimeline: "3 months",
  techStack: ["Python", "MQTT"],
  coreFeatures: ["Sensor dashboard", "Auto valves"],
  blueprint: validBlueprint,
};

test("profile: accepts valid input", () => {
  const r = profileSchema.safeParse({
    interests: "IoT",
    skills: "Python",
    domain: "Web",
    difficulty: "Intermediate",
  });
  expect(r.success).toBe(true);
});

test("profile: rejects empty required fields", () => {
  expect(profileSchema.safeParse({ interests: "", skills: "", domain: "", difficulty: "Intermediate" }).success).toBe(false);
});

test("profile: rejects invalid difficulty", () => {
  expect(
    profileSchema.safeParse({ interests: "a", skills: "b", domain: "c", difficulty: "Expert" }).success,
  ).toBe(false);
});

test("profile: rejects oversized input (cost/abuse guard)", () => {
  expect(
    profileSchema.safeParse({ interests: "x".repeat(501), skills: "b", domain: "c", difficulty: "Beginner" }).success,
  ).toBe(false);
});

test("project: accepts a well-formed project with blueprint", () => {
  expect(projectSchema.safeParse(validProject).success).toBe(true);
});

test("project: rejects when the blueprint is missing", () => {
  const { blueprint, ...missing } = validProject;
  expect(projectSchema.safeParse(missing).success).toBe(false);
});

test("project: rejects a blueprint missing a required section", () => {
  const { developmentRoadmap, ...badBlueprint } = validBlueprint;
  expect(projectSchema.safeParse({ ...validProject, blueprint: badBlueprint }).success).toBe(false);
});

test("project: rejects empty techStack array", () => {
  expect(projectSchema.safeParse({ ...validProject, techStack: [] }).success).toBe(false);
});

test("projects response: requires exactly 3 projects", () => {
  expect(projectsResponseSchema.safeParse({ projects: [validProject, validProject, validProject] }).success).toBe(true);
  expect(projectsResponseSchema.safeParse({ projects: [validProject] }).success).toBe(false);
  expect(projectsResponseSchema.safeParse({ projects: Array(4).fill(validProject) }).success).toBe(false);
});

test("blueprint: accepts a well-formed blueprint", () => {
  expect(blueprintSchema.safeParse(validBlueprint).success).toBe(true);
});

test("blueprint: rejects missing roadmap", () => {
  const { developmentRoadmap, ...missing } = validBlueprint;
  expect(blueprintSchema.safeParse(missing).success).toBe(false);
});

test("refine: rejects unknown refinement option", () => {
  expect(refineRequestSchema.safeParse({ blueprint: validBlueprint, refinement: "nonsense" }).success).toBe(false);
});

test("refine: accepts a known refinement option", () => {
  expect(refineRequestSchema.safeParse({ blueprint: validBlueprint, refinement: "Simplify project" }).success).toBe(true);
});
