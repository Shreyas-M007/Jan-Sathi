export type IssueStatus = "Pending" | "In Progress" | "Resolved";
export type TimelineStage = "Submitted" | "Reviewed" | "Assigned to Contractor" | "Resolved";

export type CivicIssue = {
  id: string;
  title: string;
  description: string;
  imageName?: string;
  locationLabel: string;
  latitude?: number;
  longitude?: number;
  category: string;
  severity: number;
  department: string;
  status: IssueStatus;
  timelineStage: TimelineStage;
  upvotes: number;
  reporterId: string;
  reporterName: string;
  createdAt: string;
};

export type IssueCluster = {
  clusterId: string;
  category: string;
  department: string;
  locationLabel: string;
  latitude?: number;
  longitude?: number;
  severity: number;
  unresolvedCount: number;
  totalReports: number;
  communityVotes: number;
  statuses: IssueStatus[];
  timelineStage: TimelineStage;
  latestCreatedAt: string;
  issues: CivicIssue[];
};

const timelineOrder: TimelineStage[] = ["Submitted", "Reviewed", "Assigned to Contractor", "Resolved"];

const issues: CivicIssue[] = [
  {
    id: "seed-1",
    title: "Collapsed Footpath near Market",
    description: "Large section of pavement has caved in and pedestrians are stepping onto road.",
    imageName: "market-footpath.jpg",
    locationLabel: "KR Market Main Road",
    category: "Road & Footpath Damage",
    severity: 9,
    department: "Public Works",
    status: "Pending",
    timelineStage: "Reviewed",
    upvotes: 12,
    reporterId: "demo-citizen",
    reporterName: "Demo Citizen",
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString()
  }
];

const categoryRules = [
  { key: "pothole", category: "Deep Pothole", department: "Road Maintenance", base: 8 },
  { key: "streetlight", category: "Broken Streetlight", department: "Electrical Department", base: 5 },
  { key: "dump", category: "Illegal Dumping", department: "Sanitation", base: 6 },
  { key: "garbage", category: "Garbage Overflow", department: "Sanitation", base: 7 },
  { key: "water", category: "Water Leakage", department: "Water Board", base: 7 }
];

async function triageIssue(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Analyze the following civic issue report and provide a JSON response containing strictly:
1. "category": A concise category label (e.g., "Deep Pothole", "Broken Streetlight")
2. "severity": An integer score from 1 to 10 based on immediate public danger
3. "department": The relevant city department (e.g., "Road Maintenance", "Water Board")

Report Text: ${text}` }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const data = await response.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawJson) {
        const cleaned = rawJson.replace(/```(?:json)?/gi, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
          category: parsed.category ?? "General Civic Hazard",
          severity: typeof parsed.severity === "number" ? parsed.severity : 5,
          department: parsed.department ?? "City Operations"
        };
      }
    } catch (error) {
      console.error("Gemini API triage failed", error);
    }
  }

  // Fallback if API key is missing or request fails
  const lower = text.toLowerCase();
  const match = categoryRules.find((rule) => lower.includes(rule.key));

  if (match) {
    const severity = Math.min(10, match.base + (lower.includes("huge") || lower.includes("danger") ? 2 : 0));
    return {
      category: match.category,
      severity,
      department: match.department
    };
  }

  return {
    category: "General Civic Hazard",
    severity: lower.includes("accident") || lower.includes("risk") ? 8 : 4,
    department: "City Operations"
  };
}

function statusFromTimeline(stage: TimelineStage): IssueStatus {
  if (stage === "Resolved") {
    return "Resolved";
  }
  if (stage === "Assigned to Contractor") {
    return "In Progress";
  }
  return "Pending";
}

function normalizeLocation(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function clusterKey(issue: CivicIssue) {
  if (issue.latitude !== undefined && issue.longitude !== undefined) {
    return `${Math.round(issue.latitude * 100) / 100}:${Math.round(issue.longitude * 100) / 100}:${issue.category}`;
  }

  return `${normalizeLocation(issue.locationLabel)}:${issue.category}`;
}

function timelineWeight(stage: TimelineStage) {
  return timelineOrder.indexOf(stage);
}

export function listIssues() {
  return [...issues].sort((a, b) => b.severity - a.severity || Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function listIssueClusters() {
  const map = new Map<string, IssueCluster>();

  for (const issue of issues) {
    const key = clusterKey(issue);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        clusterId: key,
        category: issue.category,
        department: issue.department,
        locationLabel: issue.locationLabel,
        latitude: issue.latitude,
        longitude: issue.longitude,
        severity: issue.severity,
        unresolvedCount: issue.status === "Resolved" ? 0 : 1,
        totalReports: 1,
        communityVotes: issue.upvotes,
        statuses: [issue.status],
        timelineStage: issue.timelineStage,
        latestCreatedAt: issue.createdAt,
        issues: [issue]
      });
      continue;
    }

    existing.severity = Math.max(existing.severity, issue.severity);
    existing.unresolvedCount += issue.status === "Resolved" ? 0 : 1;
    existing.totalReports += 1;
    existing.communityVotes += issue.upvotes;
    existing.statuses.push(issue.status);
    existing.issues.push(issue);
    if (Date.parse(issue.createdAt) > Date.parse(existing.latestCreatedAt)) {
      existing.latestCreatedAt = issue.createdAt;
    }
    if (timelineWeight(issue.timelineStage) > timelineWeight(existing.timelineStage)) {
      existing.timelineStage = issue.timelineStage;
    }
  }

  return [...map.values()].sort(
    (a, b) => b.severity * 10 + b.communityVotes + b.unresolvedCount * 2 - (a.severity * 10 + a.communityVotes + a.unresolvedCount * 2)
  );
}

export function getCitizenReportSummary(reporterId: string) {
  const myIssues = issues.filter((issue) => issue.reporterId === reporterId);
  const helpfulReports = myIssues.filter((issue) => issue.upvotes >= 3 || issue.status === "Resolved").length;

  const badge =
    helpfulReports >= 10 ? "Civic Champion" : helpfulReports >= 5 ? "Neighborhood Guardian" : helpfulReports >= 2 ? "Active Watcher" : "New Reporter";

  return {
    badge,
    helpfulReports,
    reports: myIssues.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  };
}

export async function createIssue(input: {
  title: string;
  description: string;
  imageName?: string;
  locationLabel: string;
  latitude?: number;
  longitude?: number;
  reporterId?: string;
  reporterName?: string;
}) {
  const triage = await triageIssue(`${input.title} ${input.description} ${input.imageName ?? ""}`);

  const issue: CivicIssue = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    imageName: input.imageName,
    locationLabel: input.locationLabel,
    latitude: input.latitude,
    longitude: input.longitude,
    category: triage.category,
    severity: triage.severity,
    department: triage.department,
    status: "Pending",
    timelineStage: "Submitted",
    upvotes: 1,
    reporterId: input.reporterId ?? "anonymous",
    reporterName: input.reporterName ?? "Citizen",
    createdAt: new Date().toISOString()
  };

  issues.push(issue);
  return issue;
}

export function updateIssueStatus(id: string, status: IssueStatus) {
  const issue = issues.find((item) => item.id === id);
  if (!issue) {
    return null;
  }

  issue.status = status;
  if (status === "Resolved") {
    issue.timelineStage = "Resolved";
  } else if (status === "In Progress") {
    issue.timelineStage = "Assigned to Contractor";
  } else if (status === "Pending") {
    issue.timelineStage = "Submitted";
  }
  return issue;
}

export function advanceIssueTimeline(id: string) {
  const issue = issues.find((item) => item.id === id);
  if (!issue) {
    return null;
  }

  const currentIndex = timelineOrder.indexOf(issue.timelineStage);
  const nextStage = timelineOrder[Math.min(currentIndex + 1, timelineOrder.length - 1)];
  issue.timelineStage = nextStage;
  issue.status = statusFromTimeline(nextStage);
  return issue;
}

export function upvoteCluster(clusterId: string) {
  const clusterIssues = issues.filter((issue) => clusterKey(issue) === clusterId);
  if (!clusterIssues.length) {
    return null;
  }

  // Only increment upvotes heavily for the first underlying ticket to represent the +1 cluster vote
  // Otherwise, a cluster of N issues would gain +N votes from a single user click!
  clusterIssues[0].upvotes += 1;

  return listIssueClusters().find((cluster) => cluster.clusterId === clusterId) ?? null;
}

export function unresolvedHotspots() {
  const density = new Map<string, number>();

  for (const issue of issues) {
    if (issue.status === "Resolved") {
      continue;
    }

    const area = issue.locationLabel.split(",")[0].trim();
    density.set(area, (density.get(area) ?? 0) + 1);
  }

  return [...density.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);
}
