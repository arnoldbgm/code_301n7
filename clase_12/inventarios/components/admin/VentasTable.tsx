"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  FieldError,
  Input,
  Label,
  Modal,
  Table,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";

type VoucherItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  total: string;
  product: {
    id: string;
    code: string;
    name: string;
  };
};

type Voucher = {
  id: string;
  type: "BOLETA" | "FACTURA";
  series: string;
  number: number;
  issuedAt: string;
  subtotal: string;
  igv: string;
  total: string;
  annulledAt: string | null;
  sunatAccepted: boolean | null;
  sunatDescription: string | null;
  enlacePdf: string | null;
  enlaceXml: string | null;
  enlaceCdr: string | null;
  customer: {
    id: string;
    dni: string;
    documentType: "DNI" | "RUC";
    firstName: string;
    lastName: string;
    businessName: string | null;
  };
  items: VoucherItem[];
};

type ApiErrorResponse = {
  error?: {
    message?: string;
    details?: Array<{ path?: string; message?: string }>;
  };
};

// Default motivo for the SUNAT comunicacion de baja (max 100 chars).
const DEFAULT_ANNULMENT_MOTIVO = "ERROR DEL SISTEMA";

function getErrorMessage(body: unknown, fallback: string) {
  const error = (body as ApiErrorResponse | null)?.error;
  const detail = error?.details?.[0]?.message;

  return detail ?? error?.message ?? fallback;
}

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
});

function customerLabel(voucher: Voucher["customer"]) {
  if (voucher.documentType === "RUC" && voucher.businessName) {
    return voucher.businessName;
  }

  return `${voucher.firstName} ${voucher.lastName}`;
}

function SunatChip({ voucher }: { voucher: Voucher }) {
  if (voucher.sunatAccepted === true) {
    return (
      <Chip color="success" size="sm">
        Aceptado
      </Chip>
    );
  }

  if (voucher.sunatAccepted === false) {
    return (
      <Chip color="danger" size="sm">
        Rechazado
      </Chip>
    );
  }

  return (
    <Chip color="default" size="sm">
      Local
    </Chip>
  );
}

type VentasTableProps = {
  refreshKey?: number;
};

export default function VentasTable({ refreshKey = 0 }: VentasTableProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRefreshingSunat, setIsRefreshingSunat] = useState(false);
  const [detailVoucher, setDetailVoucher] = useState<Voucher | null>(null);
  const [annulVoucher, setAnnulVoucher] = useState<Voucher | null>(null);
  const [annulMotivo, setAnnulMotivo] = useState(DEFAULT_ANNULMENT_MOTIVO);
  const detailModal = useOverlayState({
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        setDetailVoucher(null);
      }
    },
  });
  const annulModal = useOverlayState({
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        setAnnulVoucher(null);
        setAnnulMotivo(DEFAULT_ANNULMENT_MOTIVO);
      }
    },
  });

  useEffect(() => {
    let isActive = true;

    async function loadVouchers() {
      if (isActive) {
        setIsLoading(true);
      }

      try {
        const response = await fetch("/api/ventas", { cache: "no-store" });
        const body: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message = getErrorMessage(
            body,
            "Ocurrió un error al cargar las ventas.",
          );

          if (isActive) {
            setError(message);
          }

          toast.danger("No se pudieron cargar las ventas", {
            description: message,
          });
          return;
        }

        const data = (body as { data?: Voucher[] } | null)?.data ?? [];

        if (isActive) {
          setVouchers(data);
          setError(null);
        }
      } catch {
        if (isActive) {
          setError("No se pudo conectar con el servidor.");
        }

        toast.danger("No se pudieron cargar las ventas", {
          description: "No se pudo conectar con el servidor.",
        });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadVouchers();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  function handleDetail(voucher: Voucher) {
    setDetailVoucher(voucher);
    detailModal.open();
  }

  function handleAnnulRequest(voucher: Voucher) {
    if (deletingId !== null) {
      return;
    }

    setAnnulVoucher(voucher);
    setAnnulMotivo(DEFAULT_ANNULMENT_MOTIVO);
    annulModal.open();
  }

  async function handleAnnul() {
    if (!annulVoucher || deletingId !== null) {
      return;
    }

    const voucherId = annulVoucher.id;

    setDeletingId(voucherId);

    try {
      const response = await fetch(`/api/ventas/${voucherId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: annulMotivo.trim() }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);

        toast.danger("No se pudo anular la venta", {
          description: getErrorMessage(
            body,
            "Ocurrió un error al procesar la solicitud.",
          ),
        });
        return;
      }

      toast.success("Venta anulada", {
        description:
          "La comunicación de baja fue enviada a SUNAT y el stock de los productos fue restaurado.",
      });
      setVouchers((current) =>
        current.filter((item) => item.id !== voucherId),
      );
      annulModal.close();
    } catch {
      toast.danger("No se pudo anular la venta", {
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRefreshSunat(voucherId: string) {
    if (isRefreshingSunat) {
      return;
    }

    setIsRefreshingSunat(true);

    try {
      const response = await fetch(`/api/ventas/${voucherId}/sunat`, {
        cache: "no-store",
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        toast.danger("No se pudo actualizar el estado de SUNAT", {
          description: getErrorMessage(
            body,
            "Ocurrió un error al procesar la solicitud.",
          ),
        });
        return;
      }

      const updated = (body as { data?: Voucher } | null)?.data;

      if (!updated) {
        return;
      }

      setDetailVoucher(updated);
      setVouchers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Estado de SUNAT actualizado", {
        description:
          updated.sunatAccepted === true
            ? "El comprobante está aceptado por SUNAT."
            : (updated.sunatDescription ??
              "El comprobante aún no fue aceptado por SUNAT."),
      });
    } catch {
      toast.danger("No se pudo actualizar el estado de SUNAT", {
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setIsRefreshingSunat(false);
    }
  }

  return (
    <>
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Ventas registradas"
            className="min-w-[880px]"
          >
            <Table.Header>
              <Table.Column isRowHeader>Comprobante</Table.Column>
              <Table.Column>Tipo</Table.Column>
              <Table.Column>Fecha</Table.Column>
              <Table.Column>Cliente</Table.Column>
              <Table.Column>Total</Table.Column>
              <Table.Column>SUNAT</Table.Column>
              <Table.Column>Acciones</Table.Column>
            </Table.Header>

            <Table.Body
              items={vouchers}
              renderEmptyState={() => (
                <div className="py-8 text-center text-sm text-neutral-500">
                  {isLoading
                    ? "Cargando ventas..."
                    : (error ?? "No hay ventas registradas.")}
                </div>
              )}
            >
              {(voucher) => (
                <Table.Row id={voucher.id}>
                  <Table.Cell>
                    {voucher.series}-{voucher.number}
                  </Table.Cell>
                  <Table.Cell>
                    {voucher.type === "FACTURA" ? (
                      <Chip color="accent" size="sm">
                        Factura
                      </Chip>
                    ) : (
                      <Chip color="default" size="sm">
                        Boleta
                      </Chip>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {dateFormatter.format(new Date(voucher.issuedAt))}
                  </Table.Cell>
                  <Table.Cell>
                    {customerLabel(voucher.customer)}
                    <span className="block text-xs text-neutral-400">
                      {voucher.customer.documentType}:{" "}
                      {voucher.customer.dni}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    {moneyFormatter.format(Number(voucher.total))}
                  </Table.Cell>
                  <Table.Cell>
                    <SunatChip voucher={voucher} />
                    {voucher.sunatDescription ? (
                      <span className="block max-w-[220px] truncate text-xs text-neutral-400">
                        {voucher.sunatDescription}
                      </span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => handleDetail(voucher)}
                      >
                        Ver detalle
                      </Button>
                      {voucher.enlacePdf ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() =>
                            window.open(
                              voucher.enlacePdf ?? undefined,
                              "_blank",
                              "noopener",
                            )
                          }
                        >
                          PDF
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="danger-soft"
                        isPending={deletingId === voucher.id}
                        isDisabled={deletingId !== null}
                        onPress={() => handleAnnulRequest(voucher)}
                      >
                        {deletingId === voucher.id
                          ? "Anulando..."
                          : "Anular"}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <Modal.Root state={detailModal}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog>
              {detailVoucher ? (
                <>
                  <Modal.Header>
                    <Modal.Heading>
                      {detailVoucher.type === "FACTURA" ? "Factura" : "Boleta"}{" "}
                      {detailVoucher.series}-{detailVoucher.number}
                    </Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body>
                    <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-neutral-500">Cliente</dt>
                        <dd>{customerLabel(detailVoucher.customer)}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Documento</dt>
                        <dd>
                          {detailVoucher.customer.documentType}{" "}
                          {detailVoucher.customer.dni}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Fecha de emisión</dt>
                        <dd>
                          {dateFormatter.format(
                            new Date(detailVoucher.issuedAt),
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Estado SUNAT</dt>
                        <dd>
                          <SunatChip voucher={detailVoucher} />
                          {detailVoucher.sunatDescription ? (
                            <span className="block text-xs text-neutral-400">
                              {detailVoucher.sunatDescription}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    </dl>

                    <Table>
                      <Table.ScrollContainer>
                        <Table.Content
                          aria-label="Detalle del comprobante"
                          className="min-w-[520px]"
                        >
                          <Table.Header>
                            <Table.Column isRowHeader>Producto</Table.Column>
                            <Table.Column>Cant.</Table.Column>
                            <Table.Column>Precio unit.</Table.Column>
                            <Table.Column>Total</Table.Column>
                          </Table.Header>
                          <Table.Body
                            items={detailVoucher.items}
                            renderEmptyState={() => (
                              <div className="py-4 text-center text-sm text-neutral-500">
                                Sin items.
                              </div>
                            )}
                          >
                            {(item) => (
                              <Table.Row id={item.id}>
                                <Table.Cell>
                                  {item.product.code} — {item.product.name}
                                </Table.Cell>
                                <Table.Cell>{item.quantity}</Table.Cell>
                                <Table.Cell>
                                  {moneyFormatter.format(Number(item.unitPrice))}
                                </Table.Cell>
                                <Table.Cell>
                                  {moneyFormatter.format(Number(item.total))}
                                </Table.Cell>
                              </Table.Row>
                            )}
                          </Table.Body>
                        </Table.Content>
                      </Table.ScrollContainer>
                    </Table>

                    <div className="mt-4 ml-auto w-full max-w-xs space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Subtotal</span>
                        <span>
                          {moneyFormatter.format(Number(detailVoucher.subtotal))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">IGV (18%)</span>
                        <span>
                          {moneyFormatter.format(Number(detailVoucher.igv))}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>
                          {moneyFormatter.format(Number(detailVoucher.total))}
                        </span>
                      </div>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <div className="flex flex-wrap justify-end gap-2">
                      {detailVoucher.enlacePdf ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() =>
                            window.open(
                              detailVoucher.enlacePdf ?? undefined,
                              "_blank",
                              "noopener",
                            )
                          }
                        >
                          Ver PDF
                        </Button>
                      ) : null}
                      {detailVoucher.enlaceXml ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() =>
                            window.open(
                              detailVoucher.enlaceXml ?? undefined,
                              "_blank",
                              "noopener",
                            )
                          }
                        >
                          Ver XML
                        </Button>
                      ) : null}
                      {detailVoucher.enlaceCdr ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() =>
                            window.open(
                              detailVoucher.enlaceCdr ?? undefined,
                              "_blank",
                              "noopener",
                            )
                          }
                        >
                          Ver CDR
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        isPending={isRefreshingSunat}
                        onPress={() => handleRefreshSunat(detailVoucher.id)}
                      >
                        Actualizar estado SUNAT
                      </Button>
                    </div>
                  </Modal.Footer>
                </>
              ) : null}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>

      <Modal.Root state={annulModal}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              {annulVoucher ? (
                <>
                  <Modal.Header>
                    <Modal.Heading>
                      Anular{" "}
                      {annulVoucher.type === "FACTURA" ? "factura" : "boleta"}{" "}
                      {annulVoucher.series}-{annulVoucher.number}
                    </Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body>
                    <p className="mb-4 text-sm text-neutral-500">
                      Se enviará una comunicación de baja a SUNAT a través de
                      Nubefact y el stock de los productos será restaurado.
                    </p>
                    <TextField
                      value={annulMotivo}
                      onChange={setAnnulMotivo}
                      isRequired
                    >
                      <Label>Motivo de anulación</Label>
                      <Input maxLength={100} />
                      <FieldError />
                    </TextField>
                  </Modal.Body>
                  <Modal.Footer>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onPress={annulModal.close}
                        isDisabled={deletingId !== null}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="danger"
                        isPending={deletingId !== null}
                        onPress={handleAnnul}
                      >
                        Anular comprobante
                      </Button>
                    </div>
                  </Modal.Footer>
                </>
              ) : null}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </>
  );
}
