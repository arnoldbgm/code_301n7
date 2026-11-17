import { z } from "zod";

export const documentLookupSchema = z
  .object({
    tipo: z.enum(["DNI", "RUC"], "Document type must be DNI or RUC."),
    numero: z
      .string()
      .trim()
      .regex(/^\d+$/, "Document number can only contain digits."),
  })
  .superRefine((value, context) => {
    const expectedDigits = value.tipo === "RUC" ? 11 : 8;

    if (value.numero.length !== expectedDigits) {
      context.addIssue({
        code: "custom",
        path: ["numero"],
        message: `Document number must have exactly ${expectedDigits} digits for a ${value.tipo}.`,
      });
    }
  });

export type DocumentLookupQuery = z.infer<typeof documentLookupSchema>;
