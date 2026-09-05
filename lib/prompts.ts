import type { Profile, Idea, Plan } from "./schemas";
import { REFINEMENTS } from "./schemas";

const STR = { type: "string" } as const;
const STR_ARRAY = { type: "array", items: { type: "string" } } as const;

// Must mirror the Zod schemas in schemas.ts.
export const ideasJsonSchema = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: STR,
          problem: STR,
          solution: STR,
          whyItFits: STR,
          difficulty: STR,
          estimatedTimeline: STR,
          techStack: STR_ARRAY,
          coreFeatures: STR_ARRAY,
        },
        required: [
          "title", "problem", "solution", "whyItFits",
          "difficulty", "estimatedTimeline", "techStack", "coreFeatures",
        ],
      },
    },
  },
  required: ["ideas"],
} as const;

export const planJsonSchema = {
  type: "object",
  properties: {
    projectTitle: STR,
    problemStatement: STR,
    solution: STR,
    whyThisProject: STR,
    features: STR_ARRAY,
    techStack: STR_ARRAY,
    developmentRoadmap: STR_ARRAY,
    testingStrategy: STR_ARRAY,
    futureScope: STR_ARRAY,
    estimatedTimeline: STR,
  },
  required: [
    "projectTitle", "problemStatement", "solution", "whyThisProject",
    "features", "techStack", "developmentRoadmap", "testingStrategy",
    "futureScope", "estimatedTimeline",
  ],
} as const;

const MENTOR =
  "You are an experienced final-year project mentor for university students. " +
  "Give practical, achievable advice grounded in the student's actual skills, timeline, and constraints. " +
  "Avoid vague buzzwords. Return only the requested JSON.";

export function ideasPrompt(p: Profile): string {
  return `${MENTOR}

Generate 4 to 6 tailored final-year project ideas for this student.

Interests: ${p.interests}
Current skills: ${p.skills}
Preferred domain: ${p.domain}
Preferred difficulty: ${p.difficulty}
Time / constraints: ${p.constraints || "not specified"}

Constraints (follow strictly):
- Every idea must be genuinely completable by one student within their stated time, budget, and skills.
- Each technology in techStack must be justified by the student's stated skills or be reasonably learnable within their timeline; do not suggest tools they have no basis for.
- If the constraints mention a low or limited budget, prefer free, open-source, and locally runnable solutions; avoid paid APIs, managed cloud services, GPU-heavy training, and multi-service architectures unless the constraints clearly allow them.
- Keep the scope to a practical final-year project, not a startup-scale or production-grade multi-team system.
- Match the student's interests, preferred domain, and difficulty.`;
}

export function planPrompt(idea: Idea): string {
  return `${MENTOR}

Produce a detailed mentorship plan for the student to build this project.

Project: ${idea.title}
Problem: ${idea.problem}
Proposed solution: ${idea.solution}
Suggested tech stack: ${idea.techStack.join(", ")}
Estimated timeline: ${idea.estimatedTimeline}

developmentRoadmap must be ordered, concrete steps. testingStrategy must be specific to this project. Keep it achievable for one student.`;
}

export function refinePrompt(plan: Plan, refinement: (typeof REFINEMENTS)[number]): string {
  return `${MENTOR}

Here is an existing project mentorship plan as JSON:
${JSON.stringify(plan)}

Revise the entire plan to satisfy this constraint: "${refinement}".
Keep the same project unless the constraint requires changing its scope. Adjust features, tech stack, roadmap, testing, timeline, and future scope so they remain internally consistent. Return the full revised plan in the same JSON structure.`;
}
