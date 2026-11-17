import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresa un correo electrónico válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(120, "El nombre debe tener como máximo 120 caracteres."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(120, "El correo debe tener como máximo 120 caracteres.")
      .email("Ingresa un correo electrónico válido."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña debe tener como máximo 72 caracteres."),
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

