import { z } from "zod";

// ---- Student profile (client input) ----
export const profileSchema = z.object({
  interests: z.string().trim().min(1, "Interests are required").max(500),
  skills: z.string().trim().min(1, "Skills are required").max(500),
  domain: z.string().trim().min(1, "Domain is required").max(120),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  constraints: z.string().trim().max(500).optional(),
});
export type Profile = z.infer<typeof profileSchema>;

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

// ---- Mentorship blueprint (part of each AI project) ----
export const blueprintSchema = z.object({
  problemStatement: z.string().min(1),
  solution: z.string().min(1),
  whyThisProject: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  techStack: z.array(z.string().min(1)).min(1),
  developmentRoadmap: z.array(z.string().min(1)).min(1),
  testingStrategy: z.array(z.string().min(1)).min(1),
  futureScope: z.array(z.string().min(1)).min(1),
  estimatedTimeline: z.string().min(1),
});
export type Blueprint = z.infer<typeof blueprintSchema>;

// ---- Project (AI output): concise selection data + full blueprint ----
export const projectSchema = z.object({
  title: z.string().min(1),
  shortDescription: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  whyItFits: z.string().min(1),
  difficulty: z.string().min(1),
  estimatedTimeline: z.string().min(1),
  techStack: z.array(z.string().min(1)).min(1),
  coreFeatures: z.array(z.string().min(1)).min(1),
  blueprint: blueprintSchema,
});
export type Project = z.infer<typeof projectSchema>;

// Exactly three tailored projects per the single generation request.
export const projectsResponseSchema = z.object({
  projects: z.array(projectSchema).length(3),
});

// ---- Refine (client input) — operates on an existing blueprint ----
export const REFINEMENTS = [
  "Simplify project",
  "Make it more advanced",
  "Add AI capability",
  "Reduce cost",
  "Shorten timeline",
] as const;

export const refineRequestSchema = z.object({
  blueprint: blueprintSchema,
  refinement: z.enum(REFINEMENTS),
});
