import { Prisma } from "@/src/generated/prisma/client";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { parseJsonBody } from "@/src/lib/api/request";
import {
  buildGenerarComprobantePayload,
  generarComprobante,
  isNubefactConfigured,
  sunatFieldsFromResponse,
} from "@/src/lib/nubefact";
import { prisma } from "@/src/lib/prisma";
import {
  DEFAULT_SERIES,
  SERIES_START_NUMBER,
  createVoucherSchema,
} from "@/src/lib/validations/voucher";

// IGV (Peru): prices include 18% VAT.
const IGV_FACTOR = new Prisma.Decimal("1.18");

const CUSTOMER_SELECT = {
  id: true,
  dni: true,
  documentType: true,
  firstName: true,
  lastName: true,
  businessName: true,
  address: true,
  email: true,
} as const;

const PRODUCT_SELECT = {
  id: true,
  code: true,
  name: true,
} as const;

const VOUCHER_INCLUDE = {
  customer: { select: CUSTOMER_SELECT },
  items: {
    include: { product: { select: PRODUCT_SELECT } },
    orderBy: { createdAt: "asc" },
  },
} as const;

export async function GET() {
  try {
    const vouchers = await prisma.voucher.findMany({
      where: { annulledAt: null },
      orderBy: { createdAt: "desc" },
      include: VOUCHER_INCLUDE,
    });

    return Response.json({ data: vouchers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, createVoucherSchema);

    let voucher = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new ApiError(
          404,
          "CUSTOMER_NOT_FOUND",
          "Customer not found.",
        );
      }

      if (data.type === "FACTURA" && customer.documentType !== "RUC") {
        throw new ApiError(
          422,
          "FACTURA_REQUIRES_RUC_CUSTOMER",
          "Facturas require a customer with a RUC document.",
          { field: "customerId" },
        );
      }

      // Merge duplicated products into a single quantity per product.
      const quantities = new Map<string, number>();

      for (const item of data.items) {
        quantities.set(
          item.productId,
          (quantities.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const products = await tx.product.findMany({
        where: { id: { in: [...quantities.keys()] } },
      });

      const productsById = new Map(products.map((product) => [product.id, product]));

      for (const [productId, quantity] of quantities) {
        const product = productsById.get(productId);

        if (!product || !product.isActive) {
          throw new ApiError(
            404,
            "PRODUCT_NOT_AVAILABLE",
            "One of the products does not exist or is inactive.",
            { field: "productId", details: { productId } },
          );
        }

        if (product.stock < quantity) {
          throw new ApiError(
            409,
            "INSUFFICIENT_STOCK",
            `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${quantity}.`,
            { field: "productId", details: { productId } },
          );
        }
      }

      // Atomic stock decrement guarded by the stock condition itself.
      for (const [productId, quantity] of quantities) {
        const result = await tx.product.updateMany({
          where: { id: productId, isActive: true, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });

        if (result.count !== 1) {
          throw new ApiError(
            409,
            "INSUFFICIENT_STOCK",
            "Insufficient stock for one of the products.",
            { field: "productId" },
          );
        }
      }

      // Totals. unitPrice includes IGV (SUNAT "precio incluye IGV").
      // Line values are rounded per line (SUNAT style) and then summed, so
      // the line values sent to Nubefact match the stored totals exactly
      // (manual: "la suma de cada linea del comprobante debe coincidir con
      // los totales").
      let subtotal = new Prisma.Decimal(0);
      let igv = new Prisma.Decimal(0);
      let total = new Prisma.Decimal(0);
      const items = [...quantities.entries()].map(([productId, quantity]) => {
        const product = productsById.get(productId)!;
        const unitPrice = product.price;
        const lineTotal = unitPrice.mul(quantity).toDecimalPlaces(2);
        const lineSubtotal = lineTotal
          .div(IGV_FACTOR)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const lineIgv = lineTotal.sub(lineSubtotal);

        subtotal = subtotal.add(lineSubtotal);
        igv = igv.add(lineIgv);
        total = total.add(lineTotal);

        return { productId, quantity, unitPrice, total: lineTotal };
      });

      const series = DEFAULT_SERIES[data.type];
      const lastVoucher = await tx.voucher.findFirst({
        where: { series },
        orderBy: { number: "desc" },
        select: { number: true },
      });

      // Annulled vouchers keep their number so correlativos are never
      // reused (Nubefact rejects a repeated serie + numero with error 23).
      const nextNumber =
        (lastVoucher?.number ?? SERIES_START_NUMBER[data.type] - 1) + 1;

      return tx.voucher.create({
        data: {
          type: data.type,
          series,
          number: nextNumber,
          customerId: data.customerId,
          subtotal,
          igv,
          total,
          items: { create: items },
        },
        include: VOUCHER_INCLUDE,
      });
    });

    // Emit the voucher to SUNAT through Nubefact. On emission failure the
    // local voucher is rolled back (stock restored, row deleted) so the
    // operation can be retried cleanly. Caveat: if Nubefact times out after
    // actually creating the document, a retry will hit Nubefact error 23
    // ("Este documento ya existe en NubeFacT").
    if (isNubefactConfigured()) {
      try {
        const emission = await generarComprobante(
          buildGenerarComprobantePayload(voucher),
        );

        voucher = await prisma.voucher.update({
          where: { id: voucher.id },
          data: sunatFieldsFromResponse(emission),
          include: VOUCHER_INCLUDE,
        });
      } catch (error) {
        try {
          await prisma.$transaction(async (tx) => {
            for (const item of voucher.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }

            await tx.voucher.delete({ where: { id: voucher.id } });
          });
        } catch (rollbackError) {
          console.error(
            "[ventas] Could not roll back voucher after Nubefact failure:",
            rollbackError,
          );
        }

        throw error;
      }
    }

    return Response.json({ data: voucher }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
