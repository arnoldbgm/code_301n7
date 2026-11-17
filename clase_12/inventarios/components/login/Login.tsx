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

const DASHBOARD_URL = "/admin/dashboard";

export default function Login() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!email.trim() || !password) {
      toast.warning("Completa tus credenciales", {
        description: "Ingresa tu correo y contraseña para continuar.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: DASHBOARD_URL,
      });

      if (!result?.ok) {
        toast.danger("No se pudo iniciar sesión", {
          description:
            result?.error === "CredentialsSignin"
              ? "El correo o la contraseña son incorrectos."
              : "Ocurrió un error al autenticar. Inténtalo de nuevo.",
        });
        return;
      }

      setPassword("");
      toast.success("Bienvenido", {
        description: "Accediendo al panel de administración...",
      });
      router.push(result.url ?? DASHBOARD_URL);
      router.refresh();
    } catch {
      toast.danger("No se pudo iniciar sesión", {
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form className="flex flex-col gap-4 mt-6" onSubmit={handleSubmit}>
      <TextField
        name="email"
        isRequired
        value={email}
        onChange={setEmail}
      >
        <Label>Correo</Label>
        <Input
          type="email"
          placeholder="admin@admin.com"
          inputMode="email"
          autoComplete="email"
        />
        <FieldError />
      </TextField>
      <TextField
        name="password"
        isRequired
        value={password}
        onChange={setPassword}
      >
        <Label>Contraseña</Label>
        <Input
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
        />
        <FieldError />
      </TextField>
      <Button
        type="submit"
        variant="primary"
        className="bg-black w-full"
        isPending={isSubmitting}
        isDisabled={isSubmitting}
      >
        Iniciar Sesión
      </Button>
    </Form>
  );
}
