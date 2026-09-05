import { handleJson } from "@/lib/api";
import { generateStructured } from "@/lib/gemini";
import { refineRequestSchema, blueprintSchema } from "@/lib/schemas";
import { refinePrompt, blueprintJsonSchema } from "@/lib/prompts";

export async function POST(req: Request) {
  return handleJson(req, refineRequestSchema, ({ blueprint, refinement }) =>
    generateStructured(refinePrompt(blueprint, refinement), blueprintJsonSchema, blueprintSchema),
  );
}
