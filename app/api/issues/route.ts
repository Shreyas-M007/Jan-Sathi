import { NextResponse } from "next/server";
import { createIssue, getCitizenReportSummary, getTelemetryStats, listIssueClusters, listIssues, unresolvedHotspots } from "@/lib/issues";
import fs from "fs/promises";
import path from "path";

type IssuePayload = {
  title?: string;
  description?: string;
  locationLabel?: string;
  imageName?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  reporterId?: string;
  reporterName?: string;
};

function parseNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reporterId = searchParams.get("reporterId");

  if (reporterId) {
    const summary = await getCitizenReportSummary(reporterId);
    return NextResponse.json(summary);
  }

  const [issues, clusters, hotspots, telemetry] = await Promise.all([
    listIssues(),
    listIssueClusters(),
    unresolvedHotspots(),
    getTelemetryStats()
  ]);

  return NextResponse.json({
    issues,
    clusters,
    hotspots,
    telemetry
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: IssuePayload;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const image = formData.get("image");

    let imageUrl: string | undefined = undefined;
    let imageName: string | undefined = undefined;

    if (image instanceof File) {
      if (!(image.type === "image/jpeg" || image.type === "image/png" || image.type === "image/webp")) {
        return NextResponse.json({ error: "Only JPG, PNG, and WebP uploads are supported" }, { status: 400 });
      }

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeName);
      await fs.writeFile(filePath, buffer);

      imageUrl = `/uploads/${safeName}`;
      imageName = image.name;
    }

    payload = {
      title: formData.get("title")?.toString(),
      description: formData.get("description")?.toString(),
      locationLabel: formData.get("locationLabel")?.toString(),
      imageName,
      imageUrl,
      latitude: parseNumber(formData.get("latitude")),
      longitude: parseNumber(formData.get("longitude")),
      reporterId: formData.get("reporterId")?.toString(),
      reporterName: formData.get("reporterName")?.toString()
    };
  } else {
    payload = (await request.json()) as IssuePayload;
  }

  if (!payload.title || !payload.description || !payload.locationLabel) {
    return NextResponse.json({ error: "Missing required fields: title, description, or location" }, { status: 400 });
  }

  const issue = await createIssue({
    title: payload.title,
    description: payload.description,
    locationLabel: payload.locationLabel,
    imageName: payload.imageName,
    imageUrl: payload.imageUrl,
    latitude: payload.latitude,
    longitude: payload.longitude,
    reporterId: payload.reporterId,
    reporterName: payload.reporterName
  });

  return NextResponse.json({ issue }, { status: 201 });
}
