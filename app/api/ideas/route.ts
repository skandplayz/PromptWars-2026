import { handleJson } from "@/lib/api";
import { generateStructured } from "@/lib/gemini";
import { profileSchema, projectsResponseSchema } from "@/lib/schemas";
import { ideasPrompt, projectsJsonSchema } from "@/lib/prompts";

export async function POST(req: Request) {
  return handleJson(req, profileSchema, (profile) =>
    generateStructured(ideasPrompt(profile), projectsJsonSchema, projectsResponseSchema),
  );
}
