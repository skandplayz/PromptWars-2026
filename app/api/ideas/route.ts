import { handleJson } from "@/lib/api";
import { generateStructured } from "@/lib/gemini";
import { profileSchema, ideasResponseSchema } from "@/lib/schemas";
import { ideasPrompt, ideasJsonSchema } from "@/lib/prompts";

export async function POST(req: Request) {
  return handleJson(req, profileSchema, (profile) =>
    generateStructured(ideasPrompt(profile), ideasJsonSchema, ideasResponseSchema),
  );
}
