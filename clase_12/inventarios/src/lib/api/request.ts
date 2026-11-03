import { z } from "zod";

import { ApiError } from "./errors";

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Request body must be valid JSON.",
    );
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Request body is invalid.",
      { details },
    );
  }

  return result.data;
}
