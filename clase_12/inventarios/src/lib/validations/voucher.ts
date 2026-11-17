import { z } from "zod";

export const voucherTypes = ["BOLETA", "FACTURA"] as const;

export const voucherIdSchema = z.uuid(
  "Voucher id must be a valid UUID.",
);

// Default series per voucher type (SUNAT convention: B for boletas, F for facturas).
export const DEFAULT_SERIES: Record<(typeof voucherTypes)[number], string> = {
  BOLETA: "BBB1",
  FACTURA: "FFF1",
};

// First correlativo for each series when the database has no vouchers yet.
// The Nubefact account already emitted previous documents with these series.
export const SERIES_START_NUMBER: Record<
  (typeof voucherTypes)[number],
  number
> = {
  BOLETA: 6,
  FACTURA: 8,
};

// Default motivo for the Nubefact anulacion (comunicacion de baja).
export const DEFAULT_ANNULMENT_MOTIVO = "ERROR DEL SISTEMA";

export const annulVoucherSchema = z.object({
  motivo: z
    .string("Motivo must be a string.")
    .trim()
    .min(1, "Motivo is required.")
    .max(100, "Motivo must be at most 100 characters.")
    .default(DEFAULT_ANNULMENT_MOTIVO),
});

export type AnnulVoucherInput = z.infer<typeof annulVoucherSchema>;

const voucherItemSchema = z.object({
  productId: z.uuid("Product id must be a valid UUID."),
  quantity: z
    .number("Quantity must be a number.")
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(10_000, "Quantity must be at most 10000."),
});

export const createVoucherSchema = z.object({
  type: z
    .enum(voucherTypes, "Voucher type must be BOLETA or FACTURA.")
    .default("BOLETA"),
  customerId: z.uuid("Customer id must be a valid UUID."),
  items: z
    .array(voucherItemSchema)
    .min(1, "At least one product is required.")
    .max(50, "A voucher can have at most 50 items."),
});

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
