"use client";

import { useSyncExternalStore, useState } from "react";
import type { FormEvent } from "react";
import {
  Avatar,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  NumberField,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { CldUploadWidget } from "next-cloudinary";

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

const subscribeToHydration = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

export type EditableProduct = {
  id: string;
  code: string;
  name: string;
  imageUrl: string | null;
  price: string;
  stock: number;
  isActive: boolean;
};

type ProductoFormProps = {
  product?: EditableProduct;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function ProductoForm({
  product,
  onSuccess,
  onCancel,
}: ProductoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [price, setPrice] = useState<number | undefined>(
    product ? Number(product.price) : undefined,
  );
  const [stock, setStock] = useState<number | undefined>(
    product?.stock ?? undefined,
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState<string | null>(
    product?.imageUrl ?? null,
  );
  const isMounted = useIsMounted();
  const isEditing = Boolean(product);
  const hasCloudinaryConfig = Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  );

  function handleUploadSuccess(result: { info?: unknown }) {
    const info = result.info;

    if (typeof info !== "object" || info === null) {
      return;
    }

    const secureUrl = (info as { secure_url?: unknown }).secure_url;

    if (typeof secureUrl === "string" && secureUrl.length > 0) {
      setImageUrl(secureUrl);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      code: String(data.get("code") ?? "").trim(),
      name: String(data.get("name") ?? "").trim(),
      imageUrl,
      price: Number.isFinite(price) ? price : 0,
      stock: Number.isFinite(stock) ? stock : 0,
      isActive,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(
        isEditing ? `/api/productos/${product?.id}` : "/api/productos",
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
            ? "No se pudo actualizar el producto"
            : "No se pudo registrar el producto",
          {
            description: getErrorMessage(
              body,
              "Ocurrió un error al procesar la solicitud.",
            ),
          },
        );
        return;
      }

      toast.success(
        isEditing ? "Producto actualizado" : "Producto registrado",
        {
          description: `${payload.name} fue ${
            isEditing ? "actualizado" : "registrado"
          } correctamente.`,
        },
      );
      form.reset();
      setPrice(undefined);
      setStock(undefined);
      setIsActive(true);
      setImageUrl(null);
      onSuccess?.();
    } catch {
      toast.danger(
        isEditing
          ? "No se pudo actualizar el producto"
          : "No se pudo registrar el producto",
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
    >
      <TextField name="code" isRequired defaultValue={product?.code}>
        <Label>Código</Label>
        <Input placeholder="P001" />
        <FieldError />
      </TextField>

      <TextField name="name" isRequired defaultValue={product?.name}>
        <Label>Nombre</Label>
        <Input placeholder="Laptop Lenovo ThinkPad" />
        <FieldError />
      </TextField>

      <NumberField
        isRequired
        value={price}
        onChange={setPrice}
        minValue={0}
        step={0.1}
        formatOptions={{ useGrouping: false, minimumFractionDigits: 2 }}
      >
        <Label>Precio (con IGV)</Label>
        <NumberField.Group>
          <NumberField.Input />
          <NumberField.IncrementButton />
          <NumberField.DecrementButton />
        </NumberField.Group>
        <FieldError />
      </NumberField>

      <NumberField
        isRequired
        value={stock}
        onChange={setStock}
        minValue={0}
        step={1}
        formatOptions={{ useGrouping: false }}
      >
        <Label>Stock</Label>
        <NumberField.Group>
          <NumberField.Input />
          <NumberField.IncrementButton />
          <NumberField.DecrementButton />
        </NumberField.Group>
        <FieldError />
      </NumberField>

      <div className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium">Imagen del producto</span>
        <div className="flex items-center gap-4">
          <Avatar size="lg" variant="soft">
            {imageUrl ? (
              <Avatar.Image src={imageUrl} alt="Imagen del producto" />
            ) : null}
            <Avatar.Fallback>IMG</Avatar.Fallback>
          </Avatar>

          <div className="flex flex-wrap items-center gap-2">
            {!isMounted ? (
              <Button type="button" variant="secondary" isDisabled>
                Cargando...
              </Button>
            ) : hasCloudinaryConfig ? (
              <CldUploadWidget
                signatureEndpoint="/api/cloudinary/signature"
                options={{
                  folder: "inventarios/productos",
                  maxFiles: 1,
                  multiple: false,
                  resourceType: "image",
                  sources: ["local", "url", "camera"],
                  clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
                  maxFileSize: 5_000_000,
                  language: "es",
                }}
                onSuccess={handleUploadSuccess}
                onError={() =>
                  toast.danger("No se pudo subir la imagen", {
                    description:
                      "Ocurrió un error al subir la imagen a Cloudinary.",
                  })
                }
              >
                {({ open }) => (
                  <Button
                    type="button"
                    variant="secondary"
                    isDisabled={isSubmitting}
                    onPress={() => open()}
                  >
                    {imageUrl ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                )}
              </CldUploadWidget>
            ) : (
              <p className="text-sm text-neutral-500">
                Configura las variables de Cloudinary para subir imágenes.
              </p>
            )}

            {imageUrl ? (
              <Button
                type="button"
                variant="danger-soft"
                isDisabled={isSubmitting}
                onPress={() => setImageUrl(null)}
              >
                Quitar
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center md:col-span-2">
        <Switch
          name="isActive"
          isSelected={isActive}
          onChange={setIsActive}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            {isActive ? "Producto activo" : "Producto inactivo"}
          </Switch.Content>
        </Switch>
      </div>

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
        <Button type="submit" variant="primary" isPending={isSubmitting}>
          {isSubmitting
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Guardar producto"}
        </Button>
      </div>
    </Form>
  );
}
