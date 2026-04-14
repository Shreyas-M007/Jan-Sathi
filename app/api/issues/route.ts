import { NextResponse } from "next/server";
import { createIssue, getCitizenReportSummary, listIssueClusters, listIssues, unresolvedHotspots } from "@/lib/issues";

type IssuePayload = {
  title?: string;
  description?: string;
  locationLabel?: string;
  imageName?: string;
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
    return NextResponse.json(getCitizenReportSummary(reporterId));
  }

  return NextResponse.json({
    issues: listIssues(),
    clusters: listIssueClusters(),
    hotspots: unresolvedHotspots()
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let payload: IssuePayload;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const image = formData.get("image");

    if (image instanceof File && !(image.type === "image/jpeg" || image.type === "image/png")) {
      return NextResponse.json({ error: "Only JPG and PNG uploads are supported" }, { status: 400 });
    }

    payload = {
      title: formData.get("title")?.toString(),
      description: formData.get("description")?.toString(),
      locationLabel: formData.get("locationLabel")?.toString(),
      imageName: image instanceof File ? image.name : undefined,
      latitude: parseNumber(formData.get("latitude")),
      longitude: parseNumber(formData.get("longitude")),
      reporterId: formData.get("reporterId")?.toString(),
      reporterName: formData.get("reporterName")?.toString()
    };
  } else {
    payload = (await request.json()) as IssuePayload;
  }

  if (!payload.title || !payload.description || !payload.locationLabel) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const issue = await createIssue({
    title: payload.title,
    description: payload.description,
    locationLabel: payload.locationLabel,
    imageName: payload.imageName,
    latitude: payload.latitude,
    longitude: payload.longitude,
    reporterId: payload.reporterId,
    reporterName: payload.reporterName
  });

  return NextResponse.json({ issue }, { status: 201 });
}
