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

export const createCustomerSchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "DNI must contain exactly 8 digits."),
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
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
