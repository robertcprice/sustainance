import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { seedDemoData } from "@/lib/seed-demo";

export async function POST() {
  const auth = await verifyAuth();
  if (!auth?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedDemoData(auth.companyId, auth.userId);
    return NextResponse.json({ success: true, summary: result });
  } catch (error) {
    console.error("Seed demo error:", error);
    return NextResponse.json(
      { error: "Failed to seed demo data" },
      { status: 500 }
    );
  }
}
