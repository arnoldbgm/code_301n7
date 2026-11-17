import { ApiError, handleApiError } from "@/src/lib/api/errors";
import {
  consultarComprobante,
  isNubefactConfigured,
  nubefactVoucherType,
  sunatFieldsFromResponse,
} from "@/src/lib/nubefact";
import { prisma } from "@/src/lib/prisma";
import { voucherIdSchema } from "@/src/lib/validations/voucher";

function parseVoucherId(id: string) {
  const result = voucherIdSchema.safeParse(id);

  if (!result.success) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Voucher id must be a valid UUID.",
      { field: "id" },
    );
  }

  return result.data;
}

// Refreshes the SUNAT status of a voucher (Nubefact operacion
// "consultar_comprobante") and stores the latest status and links.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const voucherId = parseVoucherId(id);

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      select: { id: true, type: true, series: true, number: true },
    });

    if (!voucher) {
      throw new ApiError(404, "VOUCHER_NOT_FOUND", "Voucher not found.");
    }

    if (!isNubefactConfigured()) {
      throw new ApiError(
        503,
        "NUBEFACT_NOT_CONFIGURED",
        "Nubefact is not configured. Set NUBEFACT_URL and NUBEFACT_TOKEN in .env.",
      );
    }

    const response = await consultarComprobante({
      tipoDeComprobante: nubefactVoucherType(voucher.type),
      serie: voucher.series,
      numero: voucher.number,
    });

    const updated = await prisma.voucher.update({
      where: { id: voucherId },
      data: sunatFieldsFromResponse(response),
      include: {
        customer: {
          select: {
            id: true,
            dni: true,
            documentType: true,
            firstName: true,
            lastName: true,
            businessName: true,
          },
        },
        items: {
          include: { product: { select: { id: true, code: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
