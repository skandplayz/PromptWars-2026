import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MODEL = "gemini-flash-latest";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY is not configured on the server.");
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export class GeminiError extends Error {}

type JsonSchema = Record<string, unknown>;

// No server-side rate limiting: a public deployment can be hammered to burn
// Gemini quota. Input length caps (see schemas) bound per-call cost; add per-IP
// limiting if abuse becomes real.
export async function generateStructured<T>(
  prompt: string,
  jsonSchema: JsonSchema,
  zodSchema: z.ZodType<T>,
): Promise<T> {
  const ai = getClient();

  let interaction;
  try {
    interaction = await ai.interactions.create({
      model: MODEL,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: jsonSchema,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    if (msg.includes("429") || /quota|rate.?limit/i.test(msg)) {
      throw new GeminiError("The AI is temporarily rate-limited. Please wait a moment and try again.");
    }
    // Log the detailed SDK error server-side; never expose it to the client.
    console.error("Gemini request failed:", err);
    throw new GeminiError("The AI service is unavailable right now. Please try again.");
  }

  const text = interaction?.output_text;
  if (!text) throw new GeminiError("Gemini returned an empty response.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini returned invalid JSON.");
  }

  const result = zodSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiError("Gemini response did not match the expected structure.");
  }
  return result.data;
}
