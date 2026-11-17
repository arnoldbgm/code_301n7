import { handleApiError } from "@/src/lib/api/errors";
import { parseJsonBody } from "@/src/lib/api/request";
import { prisma } from "@/src/lib/prisma";
import { createCustomerSchema } from "@/src/lib/validations/customer";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: customers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, createCustomerSchema);
    const customer = await prisma.customer.create({ data });

    return Response.json({ data: customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
