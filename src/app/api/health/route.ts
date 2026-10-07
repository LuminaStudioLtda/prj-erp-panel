import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tables = await prisma.$queryRaw<
      { schema: string; total: bigint }[]
    >`SELECT table_schema AS schema, COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'dw')
      GROUP BY table_schema
      ORDER BY table_schema`;

    return NextResponse.json({
      ok: true,
      database: "connected",
      tables: Object.fromEntries(
        tables.map((t) => [t.schema, Number(t.total)]),
      ),
    });
  } catch {
    return NextResponse.json(
      { ok: false, database: "unreachable" },
      { status: 503 },
    );
  }
}
