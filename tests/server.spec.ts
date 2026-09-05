import { test, expect } from "@playwright/test";
import Module from "node:module";
import { z } from "zod";

// Exercises the real server-side logic (lib/gemini + lib/api) with a fake
// @google/genai SDK. No live Gemini calls are made.

process.env.GEMINI_API_KEY = "test-key";

let createImpl: (args: unknown) => Promise<unknown> = async () => ({ output_text: "{}" });

class FakeGoogleGenAI {
  interactions = { create: (args: unknown) => createImpl(args) };
  constructor(_opts: unknown) {}
}

// Intercept `require("@google/genai")` before lib/gemini is loaded below.
const load = (Module as unknown as { _load: (...a: unknown[]) => unknown })._load;
(Module as unknown as { _load: (...a: unknown[]) => unknown })._load = function (
  this: unknown,
  request: unknown,
  ...rest: unknown[]
) {
  if (request === "@google/genai") return { GoogleGenAI: FakeGoogleGenAI };
  return load.call(this, request, ...rest);
};

// Loaded via require (not import) so the loader hook above is installed first.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generateStructured, GeminiError } = require("../lib/gemini");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { handleJson } = require("../lib/api");

const schema = z.object({ name: z.string() });

test.afterAll(() => {
  (Module as unknown as { _load: unknown })._load = load;
});

// ---------- generateStructured ----------

test("generateStructured: valid structured JSON parses and validates", async () => {
  createImpl = async () => ({ output_text: JSON.stringify({ name: "ok" }) });
  await expect(generateStructured("prompt", { type: "object" }, schema)).resolves.toEqual({ name: "ok" });
});

test("generateStructured: malformed JSON throws GeminiError", async () => {
  createImpl = async () => ({ output_text: "{not valid json" });
  await expect(generateStructured("prompt", {}, schema)).rejects.toThrow(GeminiError);
  await expect(generateStructured("prompt", {}, schema)).rejects.toThrow(/invalid JSON/i);
});

test("generateStructured: response failing Zod throws GeminiError", async () => {
  createImpl = async () => ({ output_text: JSON.stringify({ wrong: 1 }) });
  await expect(generateStructured("prompt", {}, schema)).rejects.toThrow(GeminiError);
  await expect(generateStructured("prompt", {}, schema)).rejects.toThrow(/did not match the expected structure/i);
});

test("generateStructured: 429/rate-limit maps to friendly GeminiError", async () => {
  createImpl = async () => {
    throw new Error("429 Too Many Requests: quota exceeded");
  };
  await expect(generateStructured("prompt", {}, schema)).rejects.toThrow(GeminiError);
  await expect(generateStructured("prompt", {}, schema)).rejects.toThrow(/temporarily rate-limited/i);
});

test("generateStructured: empty output throws GeminiError", async () => {
  createImpl = async () => ({ output_text: "" });
  await expect(generateStructured("prompt", {}, schema)).rejects.toThrow(/empty response/i);
});

test("generateStructured: missing API key throws a generic error (no config detail leaked)", async () => {
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    createImpl = async () => ({ output_text: JSON.stringify({ name: "ok" }) });
    let caught: unknown;
    try {
      await generateStructured("prompt", {}, schema);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(GeminiError);
    // Client-facing message must not reveal the env var name or server config state.
    const msg = (caught as Error).message;
    expect(msg).toMatch(/unavailable right now/i);
    expect(msg).not.toContain("GEMINI_API_KEY");
  } finally {
    process.env.GEMINI_API_KEY = saved;
  }
});

// ---------- handleJson ----------

function jsonRequest(body: string): Request {
  return new Request("http://test.local/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

test("handleJson: unparseable body -> 400", async () => {
  const res = await handleJson(jsonRequest("{bad"), schema, async () => ({ ok: true }));
  expect(res.status).toBe(400);
  expect((await res.json()).error).toMatch(/invalid request body/i);
});

test("handleJson: input failing validation -> 400 with message", async () => {
  const res = await handleJson(jsonRequest(JSON.stringify({ name: 123 })), schema, async () => ({ ok: true }));
  expect(res.status).toBe(400);
  expect(typeof (await res.json()).error).toBe("string");
});

test("handleJson: valid input -> 200 with handler result", async () => {
  const res = await handleJson(jsonRequest(JSON.stringify({ name: "Ada" })), schema, async (d: { name: string }) => ({
    echo: d.name,
  }));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ echo: "Ada" });
});

test("handleJson: GeminiError from handler -> 502", async () => {
  const res = await handleJson(jsonRequest(JSON.stringify({ name: "Ada" })), schema, async () => {
    throw new GeminiError("The AI is temporarily rate-limited. Please wait a moment and try again.");
  });
  expect(res.status).toBe(502);
  expect((await res.json()).error).toMatch(/rate-limited/i);
});

test("handleJson: unexpected error -> 500 (no internal detail leaked)", async () => {
  const res = await handleJson(jsonRequest(JSON.stringify({ name: "Ada" })), schema, async () => {
    throw new Error("internal boom");
  });
  expect(res.status).toBe(500);
  const body = await res.json();
  expect(body.error).not.toContain("boom");
});
