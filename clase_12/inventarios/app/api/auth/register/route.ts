import { Prisma } from "@/src/generated/prisma/client";
import { ApiError, handleApiError } from "@/src/lib/api/errors";
import { parseJsonBody } from "@/src/lib/api/request";
import { registerCredentialsUser } from "@/src/lib/users";
import { registerSchema } from "@/src/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, registerSchema);
    const user = await registerCredentialsUser(data);

    return Response.json({ data: user }, { status: 201 });
  } catch (error) {
    // Unique index on `users.email`: friendly message instead of the generic
    // "a record with those unique values already exists".
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return handleApiError(
        new ApiError(
          409,
          "EMAIL_ALREADY_EXISTS",
          "Ya existe una cuenta con ese correo electrónico.",
          { field: "email" },
        ),
      );
    }

    return handleApiError(error);
  }
}
