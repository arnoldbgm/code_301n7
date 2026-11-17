import { z } from "zod";

export const productIdSchema = z.uuid(
  "Product id must be a valid UUID.",
);

const priceSchema = z
  .number("Price must be a number.")
  .min(0, "Price must be zero or positive.")
  .max(99_999_999.99, "Price must be at most 99999999.99.")
  .refine(
    (value) => Number.isInteger(Math.round(value * 100)),
    "Price can only have up to 2 decimal places.",
  );

const stockSchema = z
  .number("Stock must be a number.")
  .int("Stock must be a whole number.")
  .min(0, "Stock must be zero or positive.")
  .max(2_147_483_647, "Stock is too large.");

const imageUrlSchema = z
  .string()
  .trim()
  .max(500, "Image URL must be at most 500 characters.")
  .refine(
    (value) =>
      value === "" || value.startsWith("https://res.cloudinary.com/"),
    "Image URL must be a Cloudinary URL.",
  )
  .transform((value) => (value === "" ? null : value))
  .nullish();

export const createProductSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required.")
    .max(20, "Code must be at most 20 characters.")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
      "Code can only contain letters, numbers, dashes and underscores.",
    ),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(120, "Name must be at most 120 characters."),
  imageUrl: imageUrlSchema,
  price: priceSchema,
  stock: stockSchema,
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
