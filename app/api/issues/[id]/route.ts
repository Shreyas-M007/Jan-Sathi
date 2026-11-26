import { NextResponse } from "next/server";
import { advanceIssueTimeline, listIssueClusters, type IssueStatus, updateIssueStatus, upvoteCluster } from "@/lib/issues";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const validStatuses: IssueStatus[] = ["Pending", "In Progress", "Resolved"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const payload = await request.json();

  if (payload.action === "upvote") {
    const updatedCluster = await upvoteCluster(params.id, payload.userId);
    if (!updatedCluster) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
    }
    const clusters = await listIssueClusters();
    return NextResponse.json({ cluster: updatedCluster, clusters });
  }

  if (payload.action === "advanceTimeline") {
    const advanced = await advanceIssueTimeline(params.id);
    if (!advanced) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    return NextResponse.json({ issue: advanced });
  }

  const status = payload.status as IssueStatus;
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await updateIssueStatus(params.id, status);

  if (!updated) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ issue: updated });
}
