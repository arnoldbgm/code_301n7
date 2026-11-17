import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { consultarDni, consultarRuc } from "@/src/lib/decolecta";
import { documentLookupSchema } from "@/src/lib/validations/document";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const result = documentLookupSchema.safeParse({
      tipo: searchParams.get("tipo") ?? undefined,
      numero: searchParams.get("numero") ?? "",
    });

    if (!result.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Query parameters are invalid.",
        {
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      );
    }

    const { tipo, numero } = result.data;
    const data =
      tipo === "RUC" ? await consultarRuc(numero) : await consultarDni(numero);

    return Response.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
