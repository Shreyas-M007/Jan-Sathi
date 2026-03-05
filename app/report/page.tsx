"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CivicIssue, IssueCluster, TimelineStage } from "@/lib/issues";

type SubmitState = "idle" | "submitting" | "success" | "error";
type Session = {
  loggedIn: boolean;
  role: "Citizen" | "Admin";
  reporterId: string;
  reporterName: string;
};

const stages: TimelineStage[] = ["Submitted", "Reviewed", "Assigned to Contractor", "Resolved"];

export default function ReportPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [state, setState] = useState<SubmitState>("idle");
  const [session, setSession] = useState<Session | null>(null);
  const [myReports, setMyReports] = useState<CivicIssue[]>([]);
  const [badge, setBadge] = useState("New Reporter");
  const [helpfulReports, setHelpfulReports] = useState(0);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);

  const isAuthorized = Boolean(session?.loggedIn && session.role === "Citizen");

  const fetchCitizenSummary = async (reporterId: string) => {
    const response = await fetch(`/api/issues?reporterId=${encodeURIComponent(reporterId)}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { reports: CivicIssue[]; badge: string; helpfulReports: number };
    setMyReports(data.reports);
    setBadge(data.badge);
    setHelpfulReports(data.helpfulReports);
  };

  const fetchClusters = async () => {
    const response = await fetch("/api/issues", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { clusters: IssueCluster[] };
    setClusters(data.clusters.slice(0, 5));
  };

  useEffect(() => {
    const raw = localStorage.getItem("jan-sathi-session");
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as Session;
    setSession(parsed);

    if (parsed.loggedIn && parsed.role === "Citizen") {
      void fetchCitizenSummary(parsed.reporterId);
      void fetchClusters();
    }
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setLocationLabel(`GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setState("submitting");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("locationLabel", locationLabel);
    formData.append("reporterId", session.reporterId);
    formData.append("reporterName", session.reporterName);

    if (typeof latitude === "number") {
      formData.append("latitude", String(latitude));
    }
    if (typeof longitude === "number") {
      formData.append("longitude", String(longitude));
    }
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await fetch("/api/issues", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      setState("error");
      return;
    }

    setTitle("");
    setDescription("");
    setLocationLabel("");
    setImageFile(null);
    setLatitude(undefined);
    setLongitude(undefined);
    setState("success");
    await fetchCitizenSummary(session.reporterId);
    await fetchClusters();
  };

  const upvoteCluster = async (clusterId: string) => {
    await fetch(`/api/issues/${encodeURIComponent(clusterId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote" })
    });
    await fetchClusters();
  };

  const badgeTone = useMemo(() => {
    if (badge === "Civic Champion") return "from-amber-400 to-orange-500";
    if (badge === "Neighborhood Guardian") return "from-indigo-500 to-sky-500";
    if (badge === "Active Watcher") return "from-emerald-500 to-teal-500";
    return "from-slate-500 to-slate-600";
  }, [badge]);

  if (!isAuthorized) {
    return (
      <section className="glass-card mx-auto max-w-xl p-6 text-center">
        <h2 className="text-2xl font-semibold">Citizen login required</h2>
        <p className="mt-2 text-slate-600">Reporting is available only after login as a citizen.</p>
        <Link href="/" className="primary-btn mt-5 inline-block">
          Go to Login
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <form onSubmit={onSubmit} className="glass-card p-6">
          <h2 className="text-2xl font-semibold">Report a Civic Issue</h2>
          <p className="mt-2 text-sm text-slate-600">Submit hazards in under 30 seconds. AI triage handles categorization and urgency.</p>

          <div className="mt-6 space-y-4">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title (e.g., Huge pothole near school)" className="w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2" />
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened..." className="h-28 w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2" />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Upload image (JPG or PNG)</label>
              <input
                required
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-100 file:px-3 file:py-2 file:text-indigo-700"
              />
            </div>

            <div className="space-y-2">
              <input required value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Location (landmark/street)" className="w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2" />
              <button type="button" onClick={useCurrentLocation} className="outline-btn text-sm">
                Use current geolocation
              </button>
            </div>
          </div>

          <button disabled={state === "submitting"} className="primary-btn mt-6 w-full disabled:opacity-60">
            {state === "submitting" ? "Submitting..." : "Submit Issue"}
          </button>

          {state === "success" && <p className="mt-3 text-sm font-medium text-emerald-600">Issue submitted and merged into community cluster when applicable.</p>}
          {state === "error" && <p className="mt-3 text-sm font-medium text-rose-600">Submission failed. Please check fields and try again.</p>}
        </form>

        <section className="glass-card p-6">
          <h3 className="text-xl font-semibold">Your complaint timeline</h3>
          <p className="mt-1 text-sm text-slate-600">Track each complaint like a delivery tracker.</p>
          <div className="mt-4 space-y-4">
            {myReports.slice(0, 5).map((report) => (
              <article key={report.id} className="rounded-xl border border-indigo-100 bg-white/80 p-4">
                <p className="font-medium">{report.title}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  {stages.map((stage) => (
                    <div key={stage} className={`rounded-md px-2 py-1 text-xs ${stages.indexOf(stage) <= stages.indexOf(report.timelineStage) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {stage}
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {myReports.length === 0 && <p className="text-sm text-slate-500">No reports yet. Submit one to start your timeline.</p>}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="glass-card p-6">
          <h3 className="text-lg font-semibold">Civic Badge</h3>
          <div className={`mt-3 rounded-xl bg-gradient-to-r ${badgeTone} p-4 text-white`}>
            <p className="text-sm opacity-90">Current badge</p>
            <p className="text-xl font-bold">{badge}</p>
            <p className="mt-1 text-sm">Helpful reports: {helpfulReports}</p>
          </div>
        </section>

        <section className="glass-card p-6">
          <h3 className="text-lg font-semibold">Community voting clusters</h3>
          <p className="mt-1 text-sm text-slate-600">Upvote nearby recurring issues to raise admin priority.</p>
          <div className="mt-4 space-y-3">
            {clusters.map((cluster) => (
              <article key={cluster.clusterId} className="rounded-xl border border-indigo-100 bg-white/80 p-3">
                <p className="font-medium">{cluster.category}</p>
                <p className="text-xs text-slate-600">{cluster.locationLabel}</p>
                <p className="mt-1 text-xs text-slate-500">Reports: {cluster.totalReports} · Votes: {cluster.communityVotes}</p>
                <button className="outline-btn mt-2 w-full text-sm" onClick={() => void upvoteCluster(cluster.clusterId)}>
                  Upvote this issue cluster
                </button>
              </article>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
