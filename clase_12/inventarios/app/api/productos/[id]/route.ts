import { Prisma } from "@/src/generated/prisma/client";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { parseJsonBody } from "@/src/lib/api/request";
import { prisma } from "@/src/lib/prisma";
import {
  productIdSchema,
  updateProductSchema,
  type CreateProductInput,
} from "@/src/lib/validations/product";

function parseProductId(id: string) {
  const result = productIdSchema.safeParse(id);

  if (!result.success) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Product id must be a valid UUID.",
      { field: "id" },
    );
  }

  return result.data;
}

async function updateProduct(id: string, data: CreateProductInput) {
  try {
    return await prisma.product.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    throw error;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = parseProductId(id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { _count: { select: { voucherItems: true } } },
    });

    if (!product) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    return Response.json({ data: product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = parseProductId(id);
    const data = await parseJsonBody(request, updateProductSchema);
    const product = await updateProduct(productId, data);

    return Response.json({ data: product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const productId = parseProductId(id);

    // Items of annulled vouchers are historical only and should not block
    // product deletion; active vouchers still protect the product (FK).
    await prisma.voucherItem.deleteMany({
      where: { productId, voucher: { annulledAt: { not: null } } },
    });

    const { count } = await prisma.product.deleteMany({
      where: { id: productId },
    });

    if (count === 0) {
      throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
