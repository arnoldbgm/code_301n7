import { Prisma } from "@/src/generated/prisma/client";

type ErrorExtra = {
  details?: unknown;
  field?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly field?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    extra: ErrorExtra = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = extra.details;
    this.field = extra.field;
  }
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: ErrorExtra = {},
) {
  return Response.json(
    { error: { code, message, ...extra } },
    { status },
  );
}

type ConflictInfo = {
  code: string;
  message: string;
  field?: string;
};

function conflictSources(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  const fromMeta = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];
  const constraint =
    error.message.match(/constraint: `([^`]+)`/)?.[1] ?? "";

  return [...fromMeta, constraint].map((value) => value.toLowerCase());
}

function uniqueConflictInfo(
  error: Prisma.PrismaClientKnownRequestError,
): ConflictInfo {
  const sources = conflictSources(error);

  const customerField = ["dni", "email"].find((candidate) =>
    sources.some((value) => value.includes(candidate)),
  );

  if (customerField) {
    return {
      code: "CUSTOMER_ALREADY_EXISTS",
      field: customerField,
      message: `A customer with that ${customerField} already exists.`,
    };
  }

  if (sources.some((value) => value.includes("code"))) {
    return {
      code: "PRODUCT_CODE_ALREADY_EXISTS",
      field: "code",
      message: "A product with that code already exists.",
    };
  }

  if (sources.some((value) => value.includes("series"))) {
    return {
      code: "VOUCHER_NUMBER_CONFLICT",
      field: "series",
      message:
        "The voucher number is already in use. Please retry the operation.",
    };
  }

  return {
    code: "ALREADY_EXISTS",
    message: "A record with those unique values already exists.",
  };
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message, {
      details: error.details,
      field: error.field,
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const info = uniqueConflictInfo(error);

    return errorResponse(409, info.code, info.message, {
      field: info.field,
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return errorResponse(
      409,
      "RECORD_IN_USE",
      "This record is referenced by other records and cannot be deleted.",
    );
  }

  console.error("[api] Unhandled error:", error);

  return errorResponse(
    500,
    "INTERNAL_ERROR",
    "An unexpected error occurred.",
  );
}
