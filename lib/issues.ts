export type IssueStatus = "Pending" | "In Progress" | "Resolved";

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
  createdAt: string;
};

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
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString()
  }
];

const categoryRules = [
  { key: "pothole", category: "Deep Pothole", department: "Road Maintenance", base: 8 },
  { key: "streetlight", category: "Broken Streetlight", department: "Electrical Department", base: 5 },
  { key: "dump", category: "Illegal Dumping", department: "Sanitation", base: 6 },
  { key: "water", category: "Water Leakage", department: "Water Board", base: 7 }
];

function triageIssue(text: string) {
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

export function listIssues() {
  return [...issues].sort((a, b) => b.severity - a.severity || Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function createIssue(input: {
  title: string;
  description: string;
  imageName?: string;
  locationLabel: string;
  latitude?: number;
  longitude?: number;
}) {
  const triage = triageIssue(`${input.title} ${input.description} ${input.imageName ?? ""}`);

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
  return issue;
}
