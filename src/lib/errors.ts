import { ZodError } from "zod";

import { Prisma } from "@/generated/prisma/client";
import {
  failure,
  type ActionResult,
  type FieldErrors,
} from "@/lib/action-result";

export type AppErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

function zodFieldErrors(error: ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/** Converte qualquer erro lançado em um ActionResult de falha, sem vazar detalhes internos. */
export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return failure({ code: error.code, message: error.message });
  }
  if (error instanceof ZodError) {
    return failure({
      code: "VALIDATION",
      message: "Dados inválidos.",
      fieldErrors: zodFieldErrors(error),
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return failure({ code: "CONFLICT", message: "Registro já existente." });
    }
    if (error.code === "P2025") {
      return failure({
        code: "NOT_FOUND",
        message: "Registro não encontrado.",
      });
    }
  }
  console.error(error);
  return failure({
    code: "INTERNAL",
    message: "Erro interno. Tente novamente.",
  });
}
