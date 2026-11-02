import { NextResponse } from "next/server";
import { ZodError, type ZodType, type z } from "zod";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Wraps a route handler: converts errors into safe JSON responses without leaking internals. */
export function withErrorHandling(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message } },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_REQUEST",
              message: "The request was not valid. Please refresh the page and try again.",
            },
          },
          { status: 400 },
        );
      }
      // Log only the error type - never request content (resume text is personal data).
      console.error("[api] unexpected error:", err instanceof Error ? err.name : typeof err);
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Something went wrong on our side. Please try again." } },
        { status: 500 },
      );
    }
  };
}

const MAX_JSON_BYTES = 2 * 1024 * 1024;

export async function readJson<S extends ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_JSON_BYTES) throw new AppError("TOO_LARGE", "The request is too large.", 413);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }
  return schema.parse(body);
}
