import type { Profile, Blueprint } from "./schemas";
import { REFINEMENTS } from "./schemas";

const STR = { type: "string" } as const;
const STR_ARRAY = { type: "array", items: { type: "string" } } as const;

// JSON schema for a mentorship blueprint. Mirrors blueprintSchema in schemas.ts.
const blueprintJsonSchema = {
  type: "object",
  properties: {
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
    "problemStatement", "solution", "whyThisProject", "features", "techStack",
    "developmentRoadmap", "testingStrategy", "futureScope", "estimatedTimeline",
  ],
} as const;

// One request returns exactly three complete projects. Mirrors projectsResponseSchema.
export const projectsJsonSchema = {
  type: "object",
  properties: {
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: STR,
          shortDescription: STR,
          problem: STR,
          solution: STR,
          whyItFits: STR,
          difficulty: STR,
          estimatedTimeline: STR,
          techStack: STR_ARRAY,
          coreFeatures: STR_ARRAY,
          blueprint: blueprintJsonSchema,
        },
        required: [
          "title", "shortDescription", "problem", "solution", "whyItFits",
          "difficulty", "estimatedTimeline", "techStack", "coreFeatures", "blueprint",
        ],
      },
    },
  },
  required: ["projects"],
} as const;

export { blueprintJsonSchema };

const MENTOR =
  "You are a practical final-year project mentor for university students. " +
  "You reason about the student's interests, current skills, preferred domain, difficulty, available time, and budget/constraints, " +
  "then recommend projects the student can realistically finish. " +
  "Prioritise student fit, feasibility, practical value, and a clear implementation path over impressive-sounding technology. " +
  "Do not add databases, backend frameworks, vector stores, or ML models unless the project genuinely needs them; prefer a smaller coherent stack. " +
  "Avoid generic buzzwords. Return only the requested JSON.";

export function ideasPrompt(p: Profile): string {
  return `${MENTOR}

Recommend EXACTLY 3 tailored final-year project ideas for this student. The three must be meaningfully different from each other and ordered from most to least suitable.

Interests: ${p.interests}
Current skills: ${p.skills}
Preferred domain: ${p.domain}
Preferred difficulty: ${p.difficulty}
Available time / constraints / budget: ${p.constraints || "not specified"}

For EACH project provide concise selection fields (title, shortDescription, problem, solution, whyItFits, difficulty, estimatedTimeline, techStack, coreFeatures) AND a complete "blueprint" object with:
- problemStatement: the real-world problem, in depth
- solution: what the student will actually build
- whyThisProject: explicitly connect the project to the student's interests, skills, domain, available time, and constraints/budget
- features: the concrete features to build
- techStack: only technologies the project genuinely needs, each justified by the student's skills or reasonably learnable in the timeline
- developmentRoadmap: ordered, concrete build stages a single student can follow
- testingStrategy: specific ways to validate this project
- futureScope: realistic improvements/extensions
- estimatedTimeline: a practical timeline

Keep every project completable by one student within the stated time and budget. shortDescription must be 2-3 sentences. Do not repeat the same prose across the three projects.`;
}

export function refinePrompt(blueprint: Blueprint, refinement: (typeof REFINEMENTS)[number]): string {
  return `${MENTOR}

Here is an existing project mentorship blueprint as JSON:
${JSON.stringify(blueprint)}

Revise the entire blueprint to satisfy this constraint: "${refinement}".
Keep the same project unless the constraint requires changing its scope. Adjust features, tech stack, roadmap, testing, timeline, and future scope so they remain internally consistent. Return the full revised blueprint in the same JSON structure.`;
}
