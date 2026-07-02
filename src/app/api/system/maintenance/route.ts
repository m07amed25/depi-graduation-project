import { db } from "@/server/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await db.systemSettings.findUnique({
      where: { id: "global" },
      select: { maintenanceMode: true },
    });

    return NextResponse.json({
      maintenanceMode: settings?.maintenanceMode ?? false,
    });
  } catch (error) {
    return NextResponse.json({ maintenanceMode: false }, { status: 500 });
  }
}
