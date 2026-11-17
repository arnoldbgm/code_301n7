import { handleApiError } from "@/src/lib/api/errors";
import { parseJsonBody } from "@/src/lib/api/request";
import { prisma } from "@/src/lib/prisma";
import { createProductSchema } from "@/src/lib/validations/product";

export async function GET(request: Request) {
  try {
    const active = new URL(request.url).searchParams.get("active");

    const products = await prisma.product.findMany({
      where: active === null ? undefined : { isActive: active === "true" },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, createProductSchema);
    const product = await prisma.product.create({ data });

    return Response.json({ data: product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
