import { Prisma } from "@/src/generated/prisma/client";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { parseJsonBody } from "@/src/lib/api/request";
import { prisma } from "@/src/lib/prisma";
import {
  customerIdSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
} from "@/src/lib/validations/customer";

function parseCustomerId(id: string) {
  const result = customerIdSchema.safeParse(id);

  if (!result.success) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "Customer id must be a valid UUID.",
      { field: "id" },
    );
  }

  return result.data;
}

async function updateCustomer(id: string, data: CreateCustomerInput) {
  try {
    return await prisma.customer.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ApiError(
        404,
        "CUSTOMER_NOT_FOUND",
        "Customer not found.",
      );
    }

    throw error;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const customerId = parseCustomerId(id);
    const data = await parseJsonBody(request, updateCustomerSchema);
    const customer = await updateCustomer(customerId, data);

    return Response.json({ data: customer });
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
    const customerId = parseCustomerId(id);

    const { count } = await prisma.customer.deleteMany({
      where: { id: customerId },
    });

    if (count === 0) {
      throw new ApiError(
        404,
        "CUSTOMER_NOT_FOUND",
        "Customer not found.",
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
