"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { registerSchema } from "@/src/lib/validations/auth";

const DASHBOARD_URL = "/admin/dashboard";

type ApiErrorResponse = {
  error?: {
    message?: string;
    field?: string;
    details?: Array<{ path?: string; message?: string }>;
  };
};

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_VALUES: FormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function getErrorMessage(body: unknown, fallback: string) {
  const error = (body as ApiErrorResponse | null)?.error;
  const detail = error?.details?.[0]?.message;

  return detail ?? error?.message ?? fallback;
}

export default function Register() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsed = registerSchema.safeParse(values);

    if (!parsed.success) {
      toast.warning("Revisa los datos", {
        description:
          parsed.error.issues[0]?.message ??
          "Completa todos los campos para crear tu cuenta.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        toast.danger("No se pudo crear la cuenta", {
          description: getErrorMessage(
            body,
            "Ocurrió un error al procesar la solicitud.",
          ),
        });
        return;
      }

      // Registration succeeded: sign the new account in automatically so the
      // user lands inside the app instead of having to type the password again.
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
        callbackUrl: DASHBOARD_URL,
      }).catch(() => null);

      if (!result?.ok) {
        toast.warning("Cuenta creada", {
          description: "Inicia sesión con tu correo y contraseña.",
        });
        router.push("/");
        return;
      }

      setValues(EMPTY_VALUES);
      toast.success("Cuenta creada", {
        description: "Bienvenido, ya puedes usar tu cuenta.",
      });
      router.push(result.url ?? DASHBOARD_URL);
      router.refresh();
    } catch {
      toast.danger("No se pudo crear la cuenta", {
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        name="name"
        isRequired
        value={values.name}
        onChange={(value) => updateField("name", value)}
      >
        <Label>Nombre</Label>
        <Input placeholder="Tu nombre completo" autoComplete="name" />
        <FieldError />
      </TextField>
      <TextField
        name="email"
        isRequired
        value={values.email}
        onChange={(value) => updateField("email", value)}
      >
        <Label>Correo</Label>
        <Input
          type="email"
          placeholder="correo@ejemplo.com"
          inputMode="email"
          autoComplete="email"
        />
        <FieldError />
      </TextField>
      <TextField
        name="password"
        isRequired
        value={values.password}
        onChange={(value) => updateField("password", value)}
      >
        <Label>Contraseña</Label>
        <Input
          type="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <FieldError />
      </TextField>
      <TextField
        name="confirmPassword"
        isRequired
        value={values.confirmPassword}
        onChange={(value) => updateField("confirmPassword", value)}
      >
        <Label>Confirmar contraseña</Label>
        <Input
          type="password"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
        />
        <FieldError />
      </TextField>
      <Button
        type="submit"
        variant="primary"
        className="mt-2 w-full bg-black"
        isPending={isSubmitting}
        isDisabled={isSubmitting}
      >
        Crear cuenta
      </Button>
    </Form>
  );
}
