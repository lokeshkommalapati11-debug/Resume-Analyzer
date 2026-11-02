import { GoogleGenAI } from "@google/genai";
import type { ZodType, ZodTypeDef } from "zod";
import { AppError } from "@/lib/api/errors";
import { SYSTEM_INSTRUCTION } from "./prompts";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "CONFIG",
      "The AI service is not configured. Set GEMINI_API_KEY on the server.",
      500,
    );
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

const model = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const statusOf = (err: unknown): number | undefined => (err as { status?: number })?.status;

function extractJson(raw: string): unknown {
  let t = raw.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1];
  try {
    return JSON.parse(t);
  } catch {
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s >= 0 && e > s) return JSON.parse(t.slice(s, e + 1));
    throw new Error("no json");
  }
}

interface GenerateOptions<T> {
  prompt: string;
  schema: ZodType<T, ZodTypeDef, unknown>;
  temperature?: number;
  maxAttempts?: number;
}

/**
 * Calls Gemini in JSON mode and validates the result with Zod.
 * Retries transient API errors (with backoff) and invalid/malformed output (with feedback).
 */
export async function generateJson<T>({
  prompt,
  schema,
  temperature = 0.2,
  maxAttempts = 3,
}: GenerateOptions<T>): Promise<T> {
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let text: string | undefined;
    try {
      const res = await getClient().models.generateContent({
        model: model(),
        contents: currentPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature,
        },
      });
      text = res.text;
    } catch (err) {
      if (err instanceof AppError) throw err;
      const status = statusOf(err);
      const transient = status === 429 || (typeof status === "number" && status >= 500);
      if (transient && attempt < maxAttempts) {
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }
      console.error("[gemini] request failed, status:", status ?? "unknown");
      if (status === 401 || status === 403) {
        throw new AppError(
          "AI_REJECTED",
          "Gemini denied access. Check that GEMINI_API_KEY is valid and the Gemini API is enabled.",
          502,
        );
      }
      if (status === 400) {
        throw new AppError(
          "AI_REJECTED",
          "Gemini rejected the request. Check GEMINI_API_KEY and GEMINI_MODEL in .env.local.",
          502,
        );
      }
      if (status === 404) {
        throw new AppError(
          "AI_MODEL_UNAVAILABLE",
          "The configured Gemini model was not found or is unavailable to this API key. Set GEMINI_MODEL to a model enabled for your key.",
          502,
        );
      }
      throw new AppError(
        "AI_UNAVAILABLE",
        "The AI service is busy or unavailable. Please try again in a moment.",
        502,
      );
    }

    let problem = "empty response";
    if (text) {
      try {
        const parsed = schema.safeParse(extractJson(text));
        if (parsed.success) return parsed.data;
        problem = parsed.error.issues
          .slice(0, 5)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
      } catch {
        problem = "response was not valid JSON";
      }
    }
    currentPrompt = `${prompt}\n\nYour previous response was rejected (${problem}). Return ONLY a JSON object that exactly matches the required shape.`;
  }

  throw new AppError(
    "AI_INVALID_RESPONSE",
    "The AI returned an unexpected response. Please try again.",
    502,
  );
}
