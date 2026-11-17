"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Table, toast, useOverlayState } from "@heroui/react";

import ClienteForm, { type EditableCustomer } from "./ClienteForm";

type Customer = EditableCustomer;

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

type ClientesTableProps = {
  refreshKey?: number;
  onDeleted?: () => void;
};

export default function ClientesTable({
  refreshKey = 0,
  onDeleted,
}: ClientesTableProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const editModal = useOverlayState({
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        setEditingCustomer(null);
      }
    },
  });

  useEffect(() => {
    let isActive = true;

    async function loadCustomers() {
      if (isActive) {
        setIsLoading(true);
      }

      try {
        const response = await fetch("/api/clientes", { cache: "no-store" });
        const body: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message = getErrorMessage(
            body,
            "Ocurrió un error al cargar los clientes.",
          );

          if (isActive) {
            setError(message);
          }

          toast.danger("No se pudieron cargar los clientes", {
            description: message,
          });
          return;
        }

        const data = (body as { data?: Customer[] } | null)?.data ?? [];

        if (isActive) {
          setCustomers(data);
          setError(null);
        }
      } catch {
        if (isActive) {
          setError("No se pudo conectar con el servidor.");
        }

        toast.danger("No se pudieron cargar los clientes", {
          description: "No se pudo conectar con el servidor.",
        });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isActive = false;
    };
  }, [refreshKey, refreshToken]);

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    editModal.open();
  }

  async function handleDelete(customer: Customer) {
    if (deletingId !== null) {
      return;
    }

    setDeletingId(customer.id);

    try {
      const response = await fetch(`/api/clientes/${customer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);

        toast.danger("No se pudo eliminar el cliente", {
          description: getErrorMessage(
            body,
            "Ocurrió un error al procesar la solicitud.",
          ),
        });
        return;
      }

      toast.success("Cliente eliminado", {
        description: `${customer.firstName} ${customer.lastName} fue eliminado correctamente.`,
      });
      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id),
      );
      onDeleted?.();
    } catch {
      toast.danger("No se pudo eliminar el cliente", {
        description: "No se pudo conectar con el servidor.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Clientes registrados"
            className="min-w-[860px]"
          >
            <Table.Header>
              <Table.Column isRowHeader>Documento</Table.Column>
              <Table.Column>Nombre</Table.Column>
              <Table.Column>Apellido</Table.Column>
              <Table.Column>Razón social</Table.Column>
              <Table.Column>Teléfono</Table.Column>
              <Table.Column>Correo electrónico</Table.Column>
              <Table.Column>Acciones</Table.Column>
            </Table.Header>

            <Table.Body
              items={customers}
              renderEmptyState={() => (
                <div className="py-8 text-center text-sm text-neutral-500">
                  {isLoading
                    ? "Cargando clientes..."
                    : (error ?? "No hay clientes registrados.")}
                </div>
              )}
            >
              {(customer) => (
                <Table.Row id={customer.id}>
                  <Table.Cell>
                    <span className="block text-xs text-neutral-400">
                      {customer.documentType}
                    </span>
                    {customer.dni}
                  </Table.Cell>
                  <Table.Cell>{customer.firstName}</Table.Cell>
                  <Table.Cell>{customer.lastName}</Table.Cell>
                  <Table.Cell>{customer.businessName ?? "—"}</Table.Cell>
                  <Table.Cell>{customer.phone ?? "—"}</Table.Cell>
                  <Table.Cell>{customer.email ?? "—"}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        isDisabled={deletingId !== null}
                        aria-label={`Editar a ${customer.firstName} ${customer.lastName}`}
                        onPress={() => handleEdit(customer)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        isPending={deletingId === customer.id}
                        isDisabled={deletingId !== null}
                        aria-label={`Eliminar a ${customer.firstName} ${customer.lastName}`}
                        onPress={() => handleDelete(customer)}
                      >
                        {deletingId === customer.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <Modal.Root state={editModal}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog>
              {editingCustomer ? (
                <>
                  <Modal.Header>
                    <Modal.Heading>Editar cliente</Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body>
                    <ClienteForm
                      key={editingCustomer.id}
                      customer={editingCustomer}
                      onCancel={editModal.close}
                      onSuccess={() => {
                        editModal.close();
                        setRefreshToken((token) => token + 1);
                      }}
                    />
                  </Modal.Body>
                </>
              ) : null}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </>
  );
}
