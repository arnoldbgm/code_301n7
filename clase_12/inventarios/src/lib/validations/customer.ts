import { z } from "zod";

const optionalPhone = z
  .string()
  .trim()
  .max(20, "Phone must be at most 20 characters.")
  .regex(
    /^[0-9+\-() ]*$/,
    "Phone can only contain digits, spaces, and + - ( ) characters.",
  )
  .optional()
  .nullable()
  .transform((value) => value || null);

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? null : value,
  z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Email must be at most 120 characters.")
    .pipe(z.email("Email must be a valid email address."))
    .nullable()
    .optional(),
);

export const documentTypeSchema = z.enum(["DNI", "RUC"]);

export const customerIdSchema = z.uuid(
  "Customer id must be a valid UUID.",
);

export const createCustomerSchema = z
  .object({
    documentType: documentTypeSchema.default("DNI"),
    dni: z
      .string()
      .trim()
      .regex(/^\d+$/, "Document number can only contain digits.")
      .max(11, "Document number must be at most 11 digits."),
    businessName: z
      .string()
      .trim()
      .max(150, "Business name must be at most 150 characters.")
      .optional()
      .nullable()
      .transform((value) => value || null),
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(80, "First name must be at most 80 characters."),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required.")
      .max(80, "Last name must be at most 80 characters."),
    address: z
      .string()
      .trim()
      .min(1, "Address is required.")
      .max(200, "Address must be at most 200 characters."),
    phone: optionalPhone,
    email: optionalEmail,
  })
  .superRefine((value, context) => {
    const expectedDigits = value.documentType === "RUC" ? 11 : 8;

    if (value.dni.length !== expectedDigits) {
      context.addIssue({
        code: "custom",
        path: ["dni"],
        message: `Document number must have exactly ${expectedDigits} digits for a ${value.documentType}.`,
      });
    }

    if (value.documentType === "RUC" && !value.businessName) {
      context.addIssue({
        code: "custom",
        path: ["businessName"],
        message: "Business name is required for RUC customers.",
      });
    }
  });

export const updateCustomerSchema = createCustomerSchema;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
