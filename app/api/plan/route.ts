import { handleJson } from "@/lib/api";
import { generateStructured } from "@/lib/gemini";
import { ideaSchema, planSchema } from "@/lib/schemas";
import { planPrompt, planJsonSchema } from "@/lib/prompts";

export async function POST(req: Request) {
  return handleJson(req, ideaSchema, (idea) =>
    generateStructured(planPrompt(idea), planJsonSchema, planSchema),
  );
}
