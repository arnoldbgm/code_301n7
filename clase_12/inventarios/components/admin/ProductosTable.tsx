"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Chip,
  Modal,
  Table,
  toast,
  useOverlayState,
} from "@heroui/react";

import ProductoForm, { type EditableProduct } from "./ProductoForm";

type Product = EditableProduct & { createdAt: string };

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

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

type ProductosTableProps = {
  refreshKey?: number;
  onDeleted?: () => void;
};

export default function ProductosTable({
  refreshKey = 0,
  onDeleted,
}: ProductosTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const editModal = useOverlayState({
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        setEditingProduct(null);
      }
    },
  });

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      if (isActive) {
        setIsLoading(true);
      }

      try {
        const response = await fetch("/api/productos", { cache: "no-store" });
        const body: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message = getErrorMessage(
            body,
            "Ocurrió un error al cargar los productos.",
          );

          if (isActive) {
            setError(message);
          }

          toast.danger("No se pudieron cargar los productos", {
            description: message,
          });
          return;
        }

        const data = (body as { data?: Product[] } | null)?.data ?? [];

        if (isActive) {
          setProducts(data);
          setError(null);
        }
      } catch {
        if (isActive) {
          setError("No se pudo conectar con el servidor.");
        }

        toast.danger("No se pudieron cargar los productos", {
          description: "No se pudo conectar con el servidor.",
        });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [refreshKey, refreshToken]);

  function handleEdit(product: Product) {
    setEditingProduct(product);
    editModal.open();
  }

  async function handleDelete(product: Product) {
    if (deletingId !== null) {
      return;
    }

    setDeletingId(product.id);

    try {
      const response = await fetch(`/api/productos/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);

        toast.danger("No se pudo eliminar el producto", {
          description: getErrorMessage(
            body,
            "Ocurrió un error al procesar la solicitud.",
          ),
        });
        return;
      }

      toast.success("Producto eliminado", {
        description: `${product.name} fue eliminado correctamente.`,
      });
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      onDeleted?.();
    } catch {
      toast.danger("No se pudo eliminar el producto", {
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
            aria-label="Productos registrados"
            className="min-w-[860px]"
          >
            <Table.Header>
              <Table.Column>Imagen</Table.Column>
              <Table.Column isRowHeader>Código</Table.Column>
              <Table.Column>Nombre</Table.Column>
              <Table.Column>Precio (con IGV)</Table.Column>
              <Table.Column>Stock</Table.Column>
              <Table.Column>Estado</Table.Column>
              <Table.Column>Acciones</Table.Column>
            </Table.Header>

            <Table.Body
              items={products}
              renderEmptyState={() => (
                <div className="py-8 text-center text-sm text-neutral-500">
                  {isLoading
                    ? "Cargando productos..."
                    : (error ?? "No hay productos registrados.")}
                </div>
              )}
            >
              {(product) => (
                <Table.Row id={product.id}>
                  <Table.Cell>
                    <Avatar size="sm" variant="soft">
                      {product.imageUrl ? (
                        <Avatar.Image
                          src={product.imageUrl}
                          alt={product.name}
                        />
                      ) : null}
                      <Avatar.Fallback>
                        {getInitials(product.name)}
                      </Avatar.Fallback>
                    </Avatar>
                  </Table.Cell>
                  <Table.Cell>{product.code}</Table.Cell>
                  <Table.Cell>{product.name}</Table.Cell>
                  <Table.Cell>
                    {moneyFormatter.format(Number(product.price))}
                  </Table.Cell>
                  <Table.Cell>
                    {product.stock === 0 ? (
                      <Chip color="danger" size="sm">
                        Agotado
                      </Chip>
                    ) : (
                      product.stock
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {product.isActive ? (
                      <Chip color="success" size="sm">
                        Activo
                      </Chip>
                    ) : (
                      <Chip color="danger" size="sm">
                        Inactivo
                      </Chip>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        isDisabled={deletingId !== null}
                        aria-label={`Editar ${product.name}`}
                        onPress={() => handleEdit(product)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-soft"
                        isPending={deletingId === product.id}
                        isDisabled={deletingId !== null}
                        aria-label={`Eliminar ${product.name}`}
                        onPress={() => handleDelete(product)}
                      >
                        {deletingId === product.id
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
              {editingProduct ? (
                <>
                  <Modal.Header>
                    <Modal.Heading>Editar producto</Modal.Heading>
                    <Modal.CloseTrigger />
                  </Modal.Header>
                  <Modal.Body>
                    <ProductoForm
                      key={editingProduct.id}
                      product={editingProduct}
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
