"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";

import type { DocumentLookupResult } from "@/src/lib/decolecta";
import type { CreateCustomerInput } from "@/src/lib/validations/customer";

type ApiErrorResponse = {
  error?: {
    message?: string;
    field?: string;
    details?: Array<{ path?: string; message?: string }>;
  };
};

function getErrorMessage(body: unknown, fallback: string) {
  const error = (body as ApiErrorResponse | null)?.error;
  const detail = error?.details?.[0]?.message;

  return detail ?? error?.message ?? fallback;
}

export type EditableCustomer = {
  id: string;
  dni: string;
  documentType: "DNI" | "RUC";
  businessName: string | null;
  firstName: string;
  lastName: string;
  address: string;
  phone: string | null;
  email: string | null;
};

type ClienteFormProps = {
  customer?: EditableCustomer;
  onSuccess?: () => void;
  onCancel?: () => void;
};

type FormValues = {
  dni: string;
  businessName: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
};

function initialValues(customer?: EditableCustomer): FormValues {
  return {
    dni: customer?.dni ?? "",
    businessName: customer?.businessName ?? "",
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    address: customer?.address ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
  };
}

export default function ClienteForm({
  customer,
  onSuccess,
  onCancel,
}: ClienteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [values, setValues] = useState<FormValues>(() =>
    initialValues(customer),
  );
  const [documentType, setDocumentType] = useState<"DNI" | "RUC">(
    customer?.documentType ?? "DNI",
  );
  const isEditing = Boolean(customer);
  const isRuc = documentType === "RUC";

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setValues(initialValues());
    setDocumentType("DNI");
  }

  function readPayload(): CreateCustomerInput {
    return {
      documentType,
      dni: values.dni.trim(),
      businessName: isRuc ? values.businessName.trim() : null,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      address: values.address.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
    };
  }

  async function handleLookup() {
    if (isLookingUp) {
      return;
    }

    const numero = values.dni.trim();
    const expectedDigits = isRuc ? 11 : 8;
    const documentLabel = isRuc ? "RUC" : "DNI";

    if (!/^\d+$/.test(numero) || numero.length !== expectedDigits) {
      toast.warning(`Ingresa un ${documentLabel} válido`, {
        description: `El ${documentLabel} debe tener ${expectedDigits} dígitos numéricos.`,
      });
      return;
    }

    setIsLookingUp(true);

    try {
      const response = await fetch(
        `/api/consulta-documento?tipo=${documentType}&numero=${numero}`,
        { cache: "no-store" },
      );

      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        toast.danger(`No se pudo consultar el ${documentLabel}`, {
          description: getErrorMessage(
            body,
            "Ocurrió un error al procesar la solicitud.",
          ),
        });
        return;
      }

      const data = (body as { data?: DocumentLookupResult } | null)?.data;

      if (!data) {
        toast.danger(`No se pudo consultar el ${documentLabel}`, {
          description: "La consulta no devolvió datos.",
        });
        return;
      }

      if (data.documentType === "RUC") {
        setValues((current) => ({
          ...current,
          businessName: data.businessName,
          address: data.address || current.address,
        }));

        toast.success("RUC consultado", {
          description: `${data.businessName} · ${data.status} / ${data.condition}`,
        });
        return;
      }

      setValues((current) => ({
        ...current,
        firstName: data.firstName,
        lastName: data.lastName,
      }));

      toast.success("DNI consultado", {
        description: data.fullName,
      });
    } catch {
      toast.danger(`No se pudo consultar el ${documentLabel}`, {
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isLookingUp) {
      return;
    }

    const payload = readPayload();

    setIsSubmitting(true);

    try {
      const response = await fetch(
        isEditing ? `/api/clientes/${customer?.id}` : "/api/clientes",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        toast.danger(
          isEditing
            ? "No se pudo actualizar el cliente"
            : "No se pudo registrar el cliente",
          {
            description: getErrorMessage(
              body,
              "Ocurrió un error al procesar la solicitud.",
            ),
          },
        );
        return;
      }

      toast.success(isEditing ? "Cliente actualizado" : "Cliente registrado", {
        description: `${payload.firstName} ${payload.lastName} fue ${
          isEditing ? "actualizado" : "registrado"
        } correctamente.`,
      });
      resetForm();
      onSuccess?.();
    } catch {
      toast.danger(
        isEditing
          ? "No se pudo actualizar el cliente"
          : "No se pudo registrar el cliente",
        {
          description: "No se pudo conectar con el servidor.",
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      onSubmit={handleSubmit}
      onReset={resetForm}
    >
      <Select
        isRequired
        selectedKey={documentType}
        onSelectionChange={(value) =>
          setDocumentType(value === "RUC" ? "RUC" : "DNI")
        }
      >
        <Label>Tipo de documento</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="DNI" textValue="DNI">
              DNI
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="RUC" textValue="RUC">
              RUC
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
        <FieldError />
      </Select>

      <div className="flex items-end gap-2">
        <TextField
          name="dni"
          isRequired
          value={values.dni}
          onChange={(value) => updateField("dni", value)}
          className="min-w-0 flex-1"
        >
          <Label>{isRuc ? "RUC" : "DNI"}</Label>
          <Input
            placeholder={isRuc ? "20512345678" : "12345678"}
            inputMode="numeric"
            maxLength={isRuc ? 11 : 8}
          />
          <FieldError />
        </TextField>
        <Button
          type="button"
          variant="secondary"
          isPending={isLookingUp}
          isDisabled={isSubmitting}
          onPress={handleLookup}
        >
          {isLookingUp
            ? "Consultando..."
            : isRuc
              ? "Consultar RUC"
              : "Consultar DNI"}
        </Button>
      </div>

      {isRuc ? (
        <TextField
          name="businessName"
          isRequired
          value={values.businessName}
          onChange={(value) => updateField("businessName", value)}
          className="md:col-span-2"
        >
          <Label>Razón social</Label>
          <Input placeholder="Enter School SAC" />
          <FieldError />
        </TextField>
      ) : null}

      <TextField
        name="firstName"
        isRequired
        value={values.firstName}
        onChange={(value) => updateField("firstName", value)}
      >
        <Label>Nombres</Label>
        <Input placeholder="Juan" />
        <FieldError />
      </TextField>

      <TextField
        name="lastName"
        isRequired
        value={values.lastName}
        onChange={(value) => updateField("lastName", value)}
      >
        <Label>Apellidos</Label>
        <Input placeholder="Pérez" />
        <FieldError />
      </TextField>

      <TextField
        name="phone"
        value={values.phone}
        onChange={(value) => updateField("phone", value)}
      >
        <Label>Teléfono</Label>
        <Input placeholder="+51 999 999 999" inputMode="tel" />
        <FieldError />
      </TextField>

      <TextField
        name="email"
        value={values.email}
        onChange={(value) => updateField("email", value)}
      >
        <Label>Correo electrónico</Label>
        <Input type="email" placeholder="juan@correo.com" inputMode="email" />
        <FieldError />
      </TextField>

      <TextField
        name="address"
        isRequired
        value={values.address}
        onChange={(value) => updateField("address", value)}
        className="md:col-span-2"
      >
        <Label>Dirección</Label>
        <TextArea placeholder="Av. Siempre Viva 742" rows={3} />
        <FieldError />
      </TextField>

      <div className="flex justify-end gap-3 md:col-span-2">
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            isDisabled={isSubmitting}
            onPress={onCancel}
          >
            Cancelar
          </Button>
        ) : (
          <Button type="reset" variant="secondary" isDisabled={isSubmitting}>
            Limpiar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isPending={isSubmitting}
          isDisabled={isLookingUp}
        >
          {isSubmitting
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Guardar cliente"}
        </Button>
      </div>
    </Form>
  );
}
