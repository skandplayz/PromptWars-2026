import { NextResponse } from "next/server";
import { z } from "zod";
import { GeminiError } from "./gemini";

export async function handleJson<I, O>(
  req: Request,
  input: z.ZodType<I>,
  handler: (data: I) => Promise<O>,
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const result = await handler(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("Unexpected route error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
