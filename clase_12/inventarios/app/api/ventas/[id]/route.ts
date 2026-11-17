import { ApiError, handleApiError } from "@/src/lib/api/errors";
import {
  generarAnulacion,
  isNubefactConfigured,
  nubefactVoucherType,
} from "@/src/lib/nubefact";
import { prisma } from "@/src/lib/prisma";
import {
  DEFAULT_ANNULMENT_MOTIVO,
  annulVoucherSchema,
  voucherIdSchema,
} from "@/src/lib/validations/voucher";

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

// The DELETE body is optional: an empty body falls back to the default
// motivo for the Nubefact anulacion (comunicacion de baja).
async function parseMotivo(request: Request): Promise<string> {
  const text = await request.text().catch(() => "");

  if (!text.trim()) {
    return DEFAULT_ANNULMENT_MOTIVO;
  }

  let body: unknown;

  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Request body must be valid JSON.",
    );
  }

  const result = annulVoucherSchema.safeParse(body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    throw new ApiError(400, "VALIDATION_ERROR", "Request body is invalid.", {
      details,
    });
  }

  return result.data.motivo;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const voucherId = parseVoucherId(id);

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: {
        customer: {
          select: {
            id: true,
            dni: true,
            documentType: true,
            firstName: true,
            lastName: true,
            businessName: true,
            address: true,
          },
        },
        items: {
          include: { product: { select: { id: true, code: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!voucher) {
      throw new ApiError(404, "VOUCHER_NOT_FOUND", "Voucher not found.");
    }

    return Response.json({ data: voucher });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const voucherId = parseVoucherId(id);

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      include: { items: true },
    });

    if (!voucher) {
      throw new ApiError(404, "VOUCHER_NOT_FOUND", "Voucher not found.");
    }

    if (voucher.annulledAt) {
      throw new ApiError(
        409,
        "VOUCHER_ALREADY_ANNULLED",
        "The voucher is already annulled.",
      );
    }

    const motivo = await parseMotivo(request);

    // If the voucher was sent to SUNAT, request the comunicacion de baja
    // first. If Nubefact fails, the local voucher is kept untouched.
    if (isNubefactConfigured() && voucher.sunatAccepted !== null) {
      await generarAnulacion({
        tipoDeComprobante: nubefactVoucherType(voucher.type),
        serie: voucher.series,
        numero: voucher.number,
        motivo,
      });
    }

    // Anular: restore stock and soft-delete the voucher. The row is kept
    // (annulledAt set) so the correlativo is never reused and the SUNAT
    // history stays linked to the local record.
    await prisma.$transaction(async (tx) => {
      for (const item of voucher.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.voucher.update({
        where: { id: voucherId },
        data: { annulledAt: new Date() },
      });
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
