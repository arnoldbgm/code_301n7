import { createHash } from "node:crypto";

import { ApiError, handleApiError } from "@/src/lib/api/errors";

type SignatureRequestBody = {
  paramsToSign?: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildSignature(params: Record<string, unknown>, secret: string) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");

  return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

export async function POST(request: Request) {
  try {
    const secret = process.env.CLOUDINARY_API_SECRET;

    if (!secret) {
      throw new ApiError(
        503,
        "CLOUDINARY_NOT_CONFIGURED",
        "Cloudinary is not configured. Set CLOUDINARY_API_SECRET to enable image uploads.",
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const paramsToSign = (body as SignatureRequestBody | null)?.paramsToSign;

    if (!isPlainObject(paramsToSign)) {
      throw new ApiError(
        400,
        "INVALID_SIGNATURE_REQUEST",
        "paramsToSign must be an object.",
        { field: "paramsToSign" },
      );
    }

    return Response.json({
      signature: buildSignature(paramsToSign, secret),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
