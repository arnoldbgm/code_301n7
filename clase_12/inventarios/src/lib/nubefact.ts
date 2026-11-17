// Nubefact API client: electronic vouchers (CPE) sent to SUNAT.
// Manual: "NUBEFACT DOC API JSON V1.md" (project root).
//
// Auth: every operation is a POST to the RUTA (NUBEFACT_URL) with the raw
// TOKEN in the Authorization header (no "Bearer" prefix) and
// Content-Type: application/json. Failures come as { "errors", "codigo" }.

import { Prisma } from "@/src/generated/prisma/client";
import { ApiError } from "@/src/lib/api/errors";

// IGV (Peru): 18%, selling prices include it.
const IGV_FACTOR = new Prisma.Decimal("1.18");

// Nubefact tipo_de_comprobante: 1 = FACTURA, 2 = BOLETA.
export type NubefactVoucherType = 1 | 2;

// Nubefact cliente_tipo_de_documento: "6" = RUC, "1" = DNI.
const CUSTOMER_DOCUMENT_CODE = {
  DNI: "1",
  RUC: "6",
} as const;

const DEFAULT_TIMEOUT_MS = 30_000;

export type NubefactItemPayload = {
  unidad_de_medida: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number; // sin IGV
  precio_unitario: number; // con IGV
  subtotal: number; // sin IGV
  tipo_de_igv: number;
  igv: number;
  total: number; // con IGV
  anticipo_regularizacion: boolean;
};

export type GenerarComprobantePayload = {
  operacion: "generar_comprobante";
  tipo_de_comprobante: NubefactVoucherType;
  serie: string;
  numero: number;
  sunat_transaction: number;
  cliente_tipo_de_documento: string;
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion: string;
  cliente_email?: string;
  fecha_de_emision: string;
  moneda: number;
  porcentaje_de_igv: number;
  total_gravada: number;
  total_igv: number;
  total: number;
  enviar_automaticamente_a_la_sunat: boolean;
  enviar_automaticamente_al_cliente: boolean;
  cancelado: boolean;
  items: NubefactItemPayload[];
};

export type NubefactComprobanteResponse = {
  tipo_de_comprobante?: number;
  serie?: string;
  numero?: number;
  enlace?: string | null;
  aceptada_por_sunat?: boolean | null;
  sunat_description?: string | null;
  sunat_note?: string | null;
  sunat_responsecode?: string | null;
  sunat_soap_error?: string | null;
  cadena_para_codigo_qr?: string | null;
  codigo_hash?: string | null;
  enlace_del_pdf?: string | null;
  enlace_del_xml?: string | null;
  enlace_del_cdr?: string | null;
  errors?: string;
  codigo?: number;
};

export type NubefactAnulacionResponse = {
  numero?: number;
  enlace?: string | null;
  sunat_ticket_numero?: string | null;
  aceptada_por_sunat?: boolean | null;
  sunat_description?: string | null;
  sunat_note?: string | null;
  sunat_responsecode?: string | null;
  sunat_soap_error?: string | null;
  enlace_del_pdf?: string | null;
  enlace_del_xml?: string | null;
  enlace_del_cdr?: string | null;
  errors?: string;
  codigo?: number;
};

export function isNubefactConfigured(): boolean {
  return Boolean(process.env.NUBEFACT_URL && process.env.NUBEFACT_TOKEN);
}

function toNumber(value: Prisma.Decimal): number {
  return Number(value.toString());
}

async function nubefactPost<TResponse>(
  payload: object,
): Promise<TResponse> {
  const url = process.env.NUBEFACT_URL;
  const token = process.env.NUBEFACT_TOKEN;

  if (!url || !token) {
    throw new ApiError(
      503,
      "NUBEFACT_NOT_CONFIGURED",
      "Nubefact is not configured. Set NUBEFACT_URL and NUBEFACT_TOKEN in .env.",
    );
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        // Raw token, no "Bearer" prefix (manual: AUTENTICACION).
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ApiError(
      502,
      "NUBEFACT_UNREACHABLE",
      "Could not reach the Nubefact API.",
      {
        details: {
          cause: error instanceof Error ? error.message : String(error),
        },
      },
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      502,
      "NUBEFACT_INVALID_RESPONSE",
      "Nubefact returned a non-JSON response.",
    );
  }

  const errorBody = body as { errors?: unknown; codigo?: unknown } | null;
  const nubefactMessage =
    typeof errorBody?.errors === "string" && errorBody.errors.trim()
      ? errorBody.errors.trim()
      : null;

  if (nubefactMessage) {
    throw new ApiError(
      502,
      "NUBEFACT_ERROR",
      `Nubefact rejected the request: ${nubefactMessage}`,
      {
        details: {
          nubefactCodigo:
            typeof errorBody?.codigo === "number" ? errorBody.codigo : null,
        },
      },
    );
  }

  if (!response.ok) {
    throw new ApiError(
      502,
      "NUBEFACT_ERROR",
      `Nubefact responded with HTTP ${response.status}.`,
    );
  }

  return body as TResponse;
}

export async function generarComprobante(
  payload: GenerarComprobantePayload,
): Promise<NubefactComprobanteResponse> {
  return nubefactPost(payload);
}

export async function consultarComprobante(input: {
  tipoDeComprobante: NubefactVoucherType;
  serie: string;
  numero: number;
}): Promise<NubefactComprobanteResponse & { anulado?: boolean | null }> {
  return nubefactPost({
    operacion: "consultar_comprobante",
    tipo_de_comprobante: input.tipoDeComprobante,
    serie: input.serie,
    numero: input.numero,
  });
}

export async function generarAnulacion(input: {
  tipoDeComprobante: NubefactVoucherType;
  serie: string;
  numero: number;
  // Max 100 chars, required by Nubefact (comunicacion de baja).
  motivo: string;
}): Promise<NubefactAnulacionResponse> {
  return nubefactPost({
    operacion: "generar_anulacion",
    tipo_de_comprobante: input.tipoDeComprobante,
    serie: input.serie,
    numero: input.numero,
    motivo: input.motivo,
  });
}

// Voucher data as loaded by the ventas API routes (Prisma shape).
export type EmissionVoucher = {
  type: "BOLETA" | "FACTURA";
  series: string;
  number: number;
  issuedAt: Date;
  subtotal: Prisma.Decimal; // sin IGV
  igv: Prisma.Decimal;
  total: Prisma.Decimal; // con IGV
  customer: {
    dni: string;
    documentType: "DNI" | "RUC";
    firstName: string;
    lastName: string;
    businessName: string | null;
    address: string;
    email: string | null;
  };
  items: Array<{
    quantity: number;
    unitPrice: Prisma.Decimal; // con IGV
    total: Prisma.Decimal; // con IGV
    product: { code: string; name: string };
  }>;
};

function formatFechaDeEmision(date: Date): string {
  // SUNAT expects the emission date in Peru time, DD-MM-YYYY.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("day")}-${value("month")}-${value("year")}`;
}

export function nubefactVoucherType(type: "BOLETA" | "FACTURA"): NubefactVoucherType {
  return type === "FACTURA" ? 1 : 2;
}

export function buildGenerarComprobantePayload(
  voucher: EmissionVoucher,
): GenerarComprobantePayload {
  // Line values: the IGV-excluded subtotal is rounded per line (SUNAT style)
  // and the line IGV is the remainder, so every line sums up exactly to the
  // voucher totals (manual: "la suma de cada línea del comprobante debe
  // coincidir con los totales"). The ventas route stores totals with the
  // same formula.
  const items: NubefactItemPayload[] = voucher.items.map((item) => {
    const lineTotal = item.total; // con IGV
    const lineSubtotal = lineTotal
      .div(IGV_FACTOR)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const lineIgv = lineTotal.sub(lineSubtotal);
    const valorUnitario = lineSubtotal.div(item.quantity).toDecimalPlaces(10);

    return {
      unidad_de_medida: "NIU", // producto
      codigo: item.product.code,
      descripcion: item.product.name,
      cantidad: item.quantity,
      valor_unitario: toNumber(valorUnitario),
      precio_unitario: toNumber(item.unitPrice),
      subtotal: toNumber(lineSubtotal),
      tipo_de_igv: 1, // gravado - operacion onerosa
      igv: toNumber(lineIgv),
      total: toNumber(lineTotal),
      anticipo_regularizacion: false,
    };
  });

  const denominacion =
    voucher.customer.documentType === "RUC" && voucher.customer.businessName
      ? voucher.customer.businessName
      : `${voucher.customer.firstName} ${voucher.customer.lastName}`.trim();

  const payload: GenerarComprobantePayload = {
    operacion: "generar_comprobante",
    tipo_de_comprobante: nubefactVoucherType(voucher.type),
    serie: voucher.series,
    numero: voucher.number,
    sunat_transaction: 1, // venta interna
    cliente_tipo_de_documento:
      CUSTOMER_DOCUMENT_CODE[voucher.customer.documentType],
    cliente_numero_de_documento: voucher.customer.dni,
    cliente_denominacion: denominacion.slice(0, 100),
    cliente_direccion: voucher.customer.address.slice(0, 100),
    fecha_de_emision: formatFechaDeEmision(voucher.issuedAt),
    moneda: 1, // soles
    porcentaje_de_igv: 18,
    total_gravada: toNumber(voucher.subtotal),
    total_igv: toNumber(voucher.igv),
    total: toNumber(voucher.total),
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: false,
    cancelado: true,
    items,
  };

  if (voucher.customer.email) {
    payload.cliente_email = voucher.customer.email;
  }

  return payload;
}

// Voucher columns to persist from a Nubefact response.
export function sunatFieldsFromResponse(
  response: NubefactComprobanteResponse,
) {
  return {
    sunatAccepted: response.aceptada_por_sunat ?? null,
    sunatDescription: response.sunat_description ?? null,
    enlacePdf: response.enlace_del_pdf ?? null,
    enlaceXml: response.enlace_del_xml ?? null,
    enlaceCdr: response.enlace_del_cdr ?? null,
    codigoHash: response.codigo_hash ?? null,
  };
}
