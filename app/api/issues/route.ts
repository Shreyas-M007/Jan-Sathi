import { NextResponse } from "next/server";
import { createIssue, listIssues } from "@/lib/issues";

export async function GET() {
  return NextResponse.json({ issues: listIssues() });
}

export async function POST(request: Request) {
  const payload = await request.json();

  if (!payload.title || !payload.description || !payload.locationLabel) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const issue = createIssue({
    title: payload.title,
    description: payload.description,
    locationLabel: payload.locationLabel,
    imageName: payload.imageName,
    latitude: payload.latitude,
    longitude: payload.longitude
  });

  return NextResponse.json({ issue }, { status: 201 });
}
