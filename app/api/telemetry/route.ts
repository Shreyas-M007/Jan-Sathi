import { NextResponse } from "next/server";
import { getTelemetryStats } from "@/lib/issues";

export async function GET() {
  const telemetry = await getTelemetryStats();
  return NextResponse.json(telemetry, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
