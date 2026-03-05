"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CivicIssue, IssueCluster, IssueStatus } from "@/lib/issues";

const statuses: IssueStatus[] = ["Pending", "In Progress", "Resolved"];
const dashboardKey = "protocol-demo";

type Session = {
  loggedIn: boolean;
  role: "Citizen" | "Admin";
};

type Hotspot = {
  area: string;
  count: number;
};

export default function AdminDashboard() {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [granted, setGranted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const fetchIssues = async () => {
    const response = await fetch("/api/issues", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { issues: CivicIssue[]; clusters: IssueCluster[]; hotspots: Hotspot[] };
    setIssues(data.issues);
    setClusters(data.clusters);
    setHotspots(data.hotspots);
    setLoading(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem("jan-sathi-session");
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as Session;
    setAuthorized(Boolean(parsed.loggedIn && parsed.role === "Admin"));
  }, []);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    void fetchIssues();
    const id = setInterval(() => void fetchIssues(), 5000);
    return () => clearInterval(id);
  }, [authorized]);

  const sortedClusters = useMemo(
    () => [...clusters].sort((a, b) => b.severity * 10 + b.communityVotes - (a.severity * 10 + a.communityVotes)),
    [clusters]
  );

  const updateStatus = async (id: string, status: IssueStatus) => {
    await fetch(`/api/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    await fetchIssues();
  };

  const advanceTimeline = async (id: string) => {
    await fetch(`/api/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advanceTimeline" })
    });
    await fetchIssues();
  };

  if (!authorized) {
    return (
      <section className="glass-card mx-auto max-w-xl p-6 text-center">
        <h2 className="text-2xl font-semibold">Admin login required</h2>
        <p className="mt-2 text-slate-600">Please login as admin first to access this dashboard.</p>
        <Link href="/" className="primary-btn mt-5 inline-block">
          Go to Login
        </Link>
      </section>
    );
  }

  if (!granted) {
    return (
      <section className="glass-card mx-auto max-w-md p-6">
        <h2 className="text-2xl font-semibold">Admin Access</h2>
        <p className="mt-2 text-sm text-slate-600">Enter dashboard access code to continue.</p>
        <input
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="Access code"
          className="mt-4 w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2"
        />
        <button
          onClick={() => setGranted(accessCode === dashboardKey)}
          className="primary-btn mt-3 w-full"
        >
          Unlock Dashboard
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Actionable Admin Dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">Clustered tickets + community votes + neighborhood heat map for smart deployment.</p>
      </div>

      <section className="glass-card p-5">
        <h3 className="text-lg font-semibold">Unresolved issue heat map</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {hotspots.map((spot) => (
            <div key={spot.area} className="rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50 p-3">
              <p className="text-sm font-semibold">{spot.area}</p>
              <p className="text-xs text-slate-600">Unresolved density</p>
              <p className="mt-1 text-2xl font-bold text-rose-700">{spot.count}</p>
            </div>
          ))}
          {hotspots.length === 0 && <p className="text-sm text-slate-500">No unresolved hotspots right now.</p>}
        </div>
      </section>

      <section className="glass-card p-5">
        <h3 className="text-lg font-semibold">Deduplicated issue clusters</h3>
        <p className="text-sm text-slate-600">Multiple reports from same GPS area are merged into one actionable cluster.</p>
        {loading ? (
          <p className="mt-3">Loading queue...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sortedClusters.map((cluster) => (
              <article key={cluster.clusterId} className="rounded-xl border border-indigo-100 bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{cluster.category}</p>
                    <p className="text-xs text-slate-600">{cluster.locationLabel}</p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1 text-sm font-semibold text-white">
                    Sev {cluster.severity} · Votes {cluster.communityVotes}
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600">{cluster.totalReports} reports merged · {cluster.unresolvedCount} unresolved</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card p-5">
        <h3 className="text-lg font-semibold">Underlying tickets</h3>
        <div className="mt-4 space-y-4">
          {issues.map((issue) => (
            <article key={issue.id} className="rounded-xl border border-indigo-100 bg-white/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{issue.title}</h4>
                  <p className="text-xs text-slate-600">{issue.locationLabel}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-r from-rose-100 to-orange-100 px-3 py-1 text-sm font-semibold text-rose-700">
                  {issue.timelineStage}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => void updateStatus(issue.id, status)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      status === issue.status ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white" : "border border-indigo-200 text-indigo-700 bg-white/90"
                    }`}
                  >
                    {status}
                  </button>
                ))}
                <button className="outline-btn text-sm" onClick={() => void advanceTimeline(issue.id)}>
                  Advance timeline
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
