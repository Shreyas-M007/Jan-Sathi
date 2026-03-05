import { NextResponse } from "next/server";
import { type IssueStatus, updateIssueStatus } from "@/lib/issues";

const validStatuses: IssueStatus[] = ["Pending", "In Progress", "Resolved"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json();
  const status = payload.status as IssueStatus;

  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = updateIssueStatus(params.id, status);

  if (!updated) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ issue: updated });
}
