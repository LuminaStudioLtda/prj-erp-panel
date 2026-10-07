import type { UserRole } from "@/generated/prisma/enums";

export type CurrentUser = {
  email: string;
  name: string;
  role: UserRole;
};
