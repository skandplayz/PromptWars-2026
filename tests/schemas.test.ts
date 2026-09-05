import { test, expect } from "@playwright/test";
import {
  profileSchema,
  ideaSchema,
  ideasResponseSchema,
  planSchema,
  refineRequestSchema,
} from "../lib/schemas";

const validIdea = {
  title: "Smart Irrigation",
  problem: "Water waste in farms",
  solution: "IoT soil sensors + control",
  whyItFits: "Matches IoT + Python skills",
  difficulty: "Intermediate",
  estimatedTimeline: "3 months",
  techStack: ["Python", "MQTT"],
  coreFeatures: ["Sensor dashboard", "Auto valves"],
};

const validPlan = {
  projectTitle: "Smart Irrigation",
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

test("idea: accepts a well-formed idea", () => {
  expect(ideaSchema.safeParse(validIdea).success).toBe(true);
});

test("idea: rejects when a required field is missing", () => {
  const { techStack, ...missing } = validIdea;
  expect(ideaSchema.safeParse(missing).success).toBe(false);
});

test("idea: rejects empty techStack array", () => {
  expect(ideaSchema.safeParse({ ...validIdea, techStack: [] }).success).toBe(false);
});

test("ideas response: bounded to 1-6 ideas", () => {
  expect(ideasResponseSchema.safeParse({ ideas: [validIdea] }).success).toBe(true);
  expect(ideasResponseSchema.safeParse({ ideas: [] }).success).toBe(false);
  expect(ideasResponseSchema.safeParse({ ideas: Array(7).fill(validIdea) }).success).toBe(false);
});

test("plan: accepts a well-formed plan", () => {
  expect(planSchema.safeParse(validPlan).success).toBe(true);
});

test("plan: rejects missing roadmap", () => {
  const { developmentRoadmap, ...missing } = validPlan;
  expect(planSchema.safeParse(missing).success).toBe(false);
});

test("refine: rejects unknown refinement option", () => {
  expect(refineRequestSchema.safeParse({ plan: validPlan, refinement: "nonsense" }).success).toBe(false);
});

test("refine: accepts a known refinement option", () => {
  expect(refineRequestSchema.safeParse({ plan: validPlan, refinement: "Make it simpler" }).success).toBe(true);
});
