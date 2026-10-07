import { cache } from "react";

import { getSessionUserId } from "@/features/auth/services/session-cookie";
import type { CurrentUser } from "@/features/auth/types";
import { prisma } from "@/lib/prisma";

/** Usuário da sessão atual, com o papel lido do banco a cada requisição. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, role: true },
  });
});
