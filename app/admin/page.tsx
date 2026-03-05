"use client";

import { useEffect, useMemo, useState } from "react";
import type { CivicIssue, IssueStatus } from "@/lib/issues";

const statuses: IssueStatus[] = ["Pending", "In Progress", "Resolved"];
const dashboardKey = "protocol-demo";

export default function AdminDashboard() {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [granted, setGranted] = useState(false);

  const fetchIssues = async () => {
    const response = await fetch("/api/issues", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { issues: CivicIssue[] };
    setIssues(data.issues);
    setLoading(false);
  };

  useEffect(() => {
    void fetchIssues();
    const id = setInterval(() => void fetchIssues(), 5000);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(() => [...issues].sort((a, b) => b.severity - a.severity), [issues]);

  const updateStatus = async (id: string, status: IssueStatus) => {
    await fetch(`/api/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    await fetchIssues();
  };

  if (!granted) {
    return (
      <section className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Admin Access</h2>
        <p className="mt-2 text-sm text-slate-600">Enter dashboard access code to continue.</p>
        <input
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="Access code"
          className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          onClick={() => setGranted(accessCode === dashboardKey)}
          className="mt-3 w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white"
        >
          Unlock Dashboard
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">Issue Triage Queue</h2>
      <p className="mt-2 text-sm text-slate-600">Live feed sorted by AI severity score (highest risk first).</p>

      {loading ? (
        <p className="mt-4">Loading queue...</p>
      ) : (
        <div className="mt-6 space-y-4">
          {sorted.map((issue) => (
            <article key={issue.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{issue.title}</h3>
                  <p className="text-sm text-slate-600">{issue.locationLabel}</p>
                </div>
                <div className="rounded-lg bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">Severity {issue.severity}/10</div>
              </div>

              <p className="mt-3 text-sm text-slate-700">{issue.description}</p>

              <dl className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-medium">{issue.category}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Department</dt>
                  <dd className="font-medium">{issue.department}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium">{issue.status}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => void updateStatus(issue.id, status)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      status === issue.status ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
