import { handleJson } from "@/lib/api";
import { generateStructured } from "@/lib/gemini";
import { refineRequestSchema, planSchema } from "@/lib/schemas";
import { refinePrompt, planJsonSchema } from "@/lib/prompts";

export async function POST(req: Request) {
  return handleJson(req, refineRequestSchema, ({ plan, refinement }) =>
    generateStructured(refinePrompt(plan, refinement), planJsonSchema, planSchema),
  );
}
