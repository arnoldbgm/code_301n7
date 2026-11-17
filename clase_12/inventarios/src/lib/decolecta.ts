// Decolecta API client: RENIEC (DNI) and SUNAT (RUC) document lookups.
// Docs: https://docs.decolecta.com
//
// Auth: every request is a GET to /v1/reniec/dni?numero=... or
// /v1/sunat/ruc?numero=... with the API key in the Authorization header.
// Successful lookups answer flat JSON with snake_case fields. Failures answer
// { "message": ... } or { "error": ... }, except the rate limiter, which
// answers an HTML 429 page.

import { ApiError } from "@/src/lib/api/errors";

const BASE_URL = "https://api.decolecta.com";
const DEFAULT_TIMEOUT_MS = 15_000;

type DecolectaDniResponse = {
  first_name?: string;
  first_last_name?: string;
  second_last_name?: string;
  full_name?: string;
  document_number?: string;
};

type DecolectaRucResponse = {
  razon_social?: string;
  numero_documento?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
};

export type DniLookupResult = {
  documentType: "DNI";
  number: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type RucLookupResult = {
  documentType: "RUC";
  number: string;
  businessName: string;
  address: string;
  status: string;
  condition: string;
  district: string;
  province: string;
  department: string;
};

export type DocumentLookupResult = DniLookupResult | RucLookupResult;

export function isDecolectaConfigured(): boolean {
  return Boolean(process.env.DECOLECTA_TOKEN);
}

function getToken(): string {
  const token = process.env.DECOLECTA_TOKEN;

  if (!token) {
    throw new ApiError(
      503,
      "DECOLECTA_NOT_CONFIGURED",
      "Decolecta is not configured. Set DECOLECTA_TOKEN in .env.",
    );
  }

  return token;
}

function text(value: string | undefined): string {
  return (value ?? "").trim();
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function providerMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;

  for (const key of ["message", "error"]) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function decolectaGet<TResponse>(
  path: string,
  notFoundMessage: string,
): Promise<TResponse> {
  const token = getToken();
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ApiError(
      502,
      "DECOLECTA_UNREACHABLE",
      "Could not reach the Decolecta API.",
      {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      },
    );
  }

  const body = await readBody(response);
  const providerError = providerMessage(body);

  if (response.status === 404) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", notFoundMessage);
  }

  // 401 is also returned when the plan's query limit is exceeded.
  if (response.status === 401) {
    throw new ApiError(
      502,
      "DECOLECTA_UNAUTHORIZED",
      "Decolecta rejected the API token (invalid token or query limit exceeded).",
    );
  }

  if (response.status === 422) {
    throw new ApiError(
      422,
      "DOCUMENT_INVALID",
      providerError ?? "The document number is not valid.",
    );
  }

  if (response.status === 429) {
    throw new ApiError(
      429,
      "DECOLECTA_RATE_LIMIT",
      "Decolecta rate limit reached. Please try again in a few seconds.",
    );
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      "DECOLECTA_ERROR",
      providerError ?? `Decolecta responded with HTTP ${response.status}.`,
    );
  }

  if (!body || typeof body !== "object") {
    throw new ApiError(
      502,
      "DECOLECTA_INVALID_RESPONSE",
      "Decolecta returned an unexpected response.",
    );
  }

  return body as TResponse;
}

export async function consultarDni(numero: string): Promise<DniLookupResult> {
  const body = await decolectaGet<DecolectaDniResponse>(
    `/v1/reniec/dni?numero=${encodeURIComponent(numero)}`,
    "No RENIEC record was found for that DNI.",
  );

  const firstName = text(body.first_name);
  const lastName = [text(body.first_last_name), text(body.second_last_name)]
    .filter(Boolean)
    .join(" ");
  const fullName = text(body.full_name) || `${firstName} ${lastName}`.trim();

  return {
    documentType: "DNI",
    number: text(body.document_number) || numero,
    firstName,
    lastName,
    fullName,
  };
}

export async function consultarRuc(numero: string): Promise<RucLookupResult> {
  const body = await decolectaGet<DecolectaRucResponse>(
    `/v1/sunat/ruc?numero=${encodeURIComponent(numero)}`,
    "No SUNAT record was found for that RUC.",
  );

  return {
    documentType: "RUC",
    number: text(body.numero_documento) || numero,
    businessName: text(body.razon_social),
    address: text(body.direccion),
    status: text(body.estado),
    condition: text(body.condicion),
    district: text(body.distrito),
    province: text(body.provincia),
    department: text(body.departamento),
  };
}
