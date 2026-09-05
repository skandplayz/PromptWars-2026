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

// ---- Idea (AI output) ----
export const ideaSchema = z.object({
  title: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  whyItFits: z.string().min(1),
  difficulty: z.string().min(1),
  estimatedTimeline: z.string().min(1),
  techStack: z.array(z.string().min(1)).min(1),
  coreFeatures: z.array(z.string().min(1)).min(1),
});
export type Idea = z.infer<typeof ideaSchema>;

export const ideasResponseSchema = z.object({
  ideas: z.array(ideaSchema).min(1).max(6),
});

// ---- Mentorship plan (AI output) ----
export const planSchema = z.object({
  projectTitle: z.string().min(1),
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
export type Plan = z.infer<typeof planSchema>;

// ---- Refine (client input) ----
export const REFINEMENTS = [
  "Make it simpler",
  "Make it more advanced",
  "Add AI",
  "Reduce cost",
  "Fit a shorter timeline",
] as const;

export const refineRequestSchema = z.object({
  plan: planSchema,
  refinement: z.enum(REFINEMENTS),
});
