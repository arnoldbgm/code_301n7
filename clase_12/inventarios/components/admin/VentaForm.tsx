"use client";

import { useEffect, useMemo, useState } from "react";
import type { Key } from "@heroui/react";
import {
  Button,
  FieldError,
  Form,
  Label,
  ListBox,
  NumberField,
  Select,
  Separator,
  toast,
} from "@heroui/react";

type CustomerOption = {
  id: string;
  dni: string;
  documentType: "DNI" | "RUC";
  firstName: string;
  lastName: string;
  businessName: string | null;
};

type ProductOption = {
  id: string;
  code: string;
  name: string;
  price: string;
  stock: number;
};

type VoucherItemLine = {
  productId: Key | null;
  quantity: number;
};

type ApiErrorResponse = {
  error?: {
    message?: string;
    details?: Array<{ path?: string; message?: string }>;
  };
};

function getErrorMessage(body: unknown, fallback: string) {
  const error = (body as ApiErrorResponse | null)?.error;
  const detail = error?.details?.[0]?.message;

  return detail ?? error?.message ?? fallback;
}

function customerLabel(customer: CustomerOption) {
  if (customer.documentType === "RUC" && customer.businessName) {
    return `${customer.businessName} (${customer.dni})`;
  }

  return `${customer.firstName} ${customer.lastName} (${customer.dni})`;
}

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

type VentaFormProps = {
  onSuccess?: () => void;
};

export default function VentaForm({ onSuccess }: VentaFormProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  const [voucherType, setVoucherType] = useState<Key | null>("BOLETA");
  const [customerId, setCustomerId] = useState<Key | null>(null);
  const [lines, setLines] = useState<VoucherItemLine[]>([
    { productId: null, quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadCatalog() {
      try {
        const [customersResponse, productsResponse] = await Promise.all([
          fetch("/api/clientes", { cache: "no-store" }),
          fetch("/api/productos?active=true", { cache: "no-store" }),
        ]);

        const customersBody: unknown = await customersResponse
          .json()
          .catch(() => null);
        const productsBody: unknown = await productsResponse
          .json()
          .catch(() => null);

        if (!isActive) {
          return;
        }

        setCustomers(
          (customersBody as { data?: CustomerOption[] } | null)?.data ?? [],
        );
        setProducts(
          (productsBody as { data?: ProductOption[] } | null)?.data ?? [],
        );
      } catch {
        toast.danger("No se pudo cargar el catálogo", {
          description: "No se pudo conectar con el servidor.",
        });
      } finally {
        if (isActive) {
          setIsLoadingCatalog(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isActive = false;
    };
  }, []);

  const totals = useMemo(() => {
    // Mirrors the API: duplicate products are merged into a single line and
    // the IGV-excluded subtotal is rounded per line, then summed.
    const quantities = new Map<string, number>();

    for (const line of lines) {
      if (line.productId === null) {
        continue;
      }

      const key = String(line.productId);
      quantities.set(key, (quantities.get(key) ?? 0) + line.quantity);
    }

    let subtotal = 0;
    let total = 0;

    for (const [productId, quantity] of quantities) {
      const product = products.find((item) => item.id === productId);

      if (!product) {
        continue;
      }

      const lineTotal =
        Math.round(Number(product.price) * quantity * 100) / 100;
      const lineSubtotal = Math.round((lineTotal / 1.18) * 100) / 100;

      total += lineTotal;
      subtotal += lineSubtotal;
    }

    const igv = Math.round((total - subtotal) * 100) / 100;

    return { subtotal, igv, total };
  }, [lines, products]);

  function addLine() {
    setLines((current) => [...current, { productId: null, quantity: 1 }]);
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, i) => i !== index));
  }

  function updateLine(index: number, changes: Partial<VoucherItemLine>) {
    setLines((current) =>
      current.map((line, i) => (i === index ? { ...line, ...changes } : line)),
    );
  }

  const selectedCustomer = customers.find((item) => item.id === customerId);
  const needsRucCustomer = voucherType === "FACTURA";
  const hasRucCustomer =
    selectedCustomer?.documentType === "RUC" ||
    selectedCustomer?.dni.length === 11;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const items = lines
      .filter((line) => line.productId !== null)
      .map((line) => ({
        productId: String(line.productId),
        quantity: line.quantity,
      }));

    if (!customerId || items.length === 0) {
      toast.danger("Venta incompleta", {
        description:
          "Selecciona un cliente y al menos un producto con cantidad.",
      });
      return;
    }

    if (needsRucCustomer && !hasRucCustomer) {
      toast.danger("La factura requiere un cliente con RUC", {
        description:
          "Registra o selecciona un cliente cuyo documento sea un RUC de 11 dígitos.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: String(voucherType),
          customerId: String(customerId),
          items,
        }),
      });

      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        toast.danger("No se pudo registrar la venta", {
          description: getErrorMessage(
            body,
            "Ocurrió un error al procesar la solicitud.",
          ),
        });
        return;
      }

      const voucher = (body as
        | {
            data?: {
              series?: string;
              number?: number;
              total?: string;
              sunatAccepted?: boolean | null;
              sunatDescription?: string | null;
            };
          }
        | null)?.data;

      const sunatSuffix =
        voucher?.sunatAccepted === true
          ? " Aceptada por SUNAT."
          : voucher?.sunatAccepted === false
            ? ` SUNAT: ${voucher.sunatDescription ?? "comprobante no aceptado"}.`
            : "";

      toast.success("Venta registrada", {
        description: `${voucher?.series ?? ""}-${voucher?.number ?? ""} por ${
          voucher?.total
            ? moneyFormatter.format(Number(voucher.total))
            : "S/ 0.00"
        } fue emitida correctamente.${sunatSuffix}`,
      });

      setVoucherType("BOLETA");
      setCustomerId(null);
      setLines([{ productId: null, quantity: 1 }]);
      onSuccess?.();
    } catch {
      toast.danger("No se pudo registrar la venta", {
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingCatalog) {
    return (
      <p className="text-sm text-neutral-500">Cargando catálogo...</p>
    );
  }

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          isRequired
          selectedKey={customerId}
          onSelectionChange={setCustomerId}
          placeholder="Selecciona un cliente"
        >
          <Label>Cliente</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {customers.map((customer) => (
                <ListBox.Item
                  key={customer.id}
                  id={customer.id}
                  textValue={customerLabel(customer)}
                >
                  {customerLabel(customer)}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          <FieldError />
        </Select>

        <Select
          isRequired
          selectedKey={voucherType}
          onSelectionChange={setVoucherType}
        >
          <Label>Tipo de comprobante</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="BOLETA" textValue="Boleta">
                Boleta
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="FACTURA" textValue="Factura">
                Factura
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
          <FieldError />
        </Select>
      </div>

      {needsRucCustomer ? (
        <p className="text-sm text-neutral-500">
          Las facturas se emiten a clientes con RUC y razón social
          {hasRucCustomer ? "." : " — el cliente seleccionado no califica."}
        </p>
      ) : null}

      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Productos</h3>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onPress={addLine}
          isDisabled={lines.length >= 50}
        >
          Agregar producto
        </Button>
      </div>

      {lines.map((line, index) => {
        const product = products.find((item) => item.id === line.productId);
        const maxQuantity = product?.stock ?? 1;

        return (
          <div
            key={index}
            className="grid grid-cols-1 items-end gap-4 rounded-xl border border-neutral-200 p-4 md:grid-cols-[1fr_auto_auto]"
          >
            <Select
              isRequired
              selectedKey={line.productId}
              onSelectionChange={(value) =>
                updateLine(index, { productId: value })
              }
              placeholder="Selecciona un producto"
            >
              <Label>Producto</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {products.map((product) => (
                    <ListBox.Item
                      key={product.id}
                      id={product.id}
                      textValue={`${product.code} — ${product.name}`}
                    >
                      {product.code} — {product.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              <FieldError />
            </Select>

            <NumberField
              isRequired
              value={line.quantity}
              onChange={(value) =>
                updateLine(index, {
                  quantity: Number.isFinite(value) ? value : 1,
                })
              }
              minValue={1}
              maxValue={Math.max(1, maxQuantity)}
              step={1}
              formatOptions={{ useGrouping: false }}
              className="w-32"
            >
              <Label>Cantidad</Label>
              <NumberField.Group>
                <NumberField.Input />
                <NumberField.IncrementButton />
                <NumberField.DecrementButton />
              </NumberField.Group>
              <FieldError />
            </NumberField>

            <div className="flex flex-col items-end gap-1">
              {product ? (
                <span className="text-sm text-neutral-500">
                  {moneyFormatter.format(
                    Number(product.price) * line.quantity,
                  )}
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="danger-soft"
                onPress={() => removeLine(index)}
                isDisabled={lines.length === 1}
                aria-label="Quitar producto"
              >
                Quitar
              </Button>
            </div>
          </div>
        );
      })}

      <div className="ml-auto w-full max-w-xs space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span>{moneyFormatter.format(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">IGV (18%)</span>
          <span>{moneyFormatter.format(totals.igv)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{moneyFormatter.format(totals.total)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="reset"
          variant="secondary"
          isDisabled={isSubmitting}
          onPress={() => {
            setVoucherType("BOLETA");
            setCustomerId(null);
            setLines([{ productId: null, quantity: 1 }]);
          }}
        >
          Limpiar
        </Button>
        <Button type="submit" variant="primary" isPending={isSubmitting}>
          {isSubmitting ? "Emitiendo..." : "Emitir comprobante"}
        </Button>
      </div>
    </Form>
  );
}
