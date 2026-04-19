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
    if (!response.ok) return;
    const data = (await response.json()) as { reports: CivicIssue[]; badge: string; helpfulReports: number };
    setMyReports(data.reports);
    setBadge(data.badge);
    setHelpfulReports(data.helpfulReports);
  };

  const fetchClusters = async () => {
    const response = await fetch("/api/issues", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { clusters: IssueCluster[] };
    setClusters(data.clusters.slice(0, 5));
  };

  useEffect(() => {
    const raw = localStorage.getItem("jan-sathi-session");
    if (!raw) return;
    const parsed = JSON.parse(raw) as Session;
    setSession(parsed);
    if (parsed.loggedIn && parsed.role === "Citizen") {
      void fetchCitizenSummary(parsed.reporterId);
      void fetchClusters();
    }
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setLocationLabel(`GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    setState("submitting");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("locationLabel", locationLabel);
    formData.append("reporterId", session.reporterId);
    formData.append("reporterName", session.reporterName);
    if (typeof latitude === "number") formData.append("latitude", String(latitude));
    if (typeof longitude === "number") formData.append("longitude", String(longitude));
    if (imageFile) formData.append("image", imageFile);

    const response = await fetch("/api/issues", { method: "POST", body: formData });
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

  const badgeConfig = useMemo(() => {
    if (badge === "Civic Champion") return { tone: "from-amber-400 to-orange-500", glow: "shadow-orange-500/50", icon: "🏆" };
    if (badge === "Neighborhood Guardian") return { tone: "from-indigo-500 to-sky-400", glow: "shadow-sky-500/50", icon: "🛡️" };
    if (badge === "Active Watcher") return { tone: "from-emerald-500 to-teal-400", glow: "shadow-teal-500/50", icon: "👁️" };
    return { tone: "from-slate-600 to-slate-500", glow: "shadow-slate-500/20", icon: "🌱" };
  }, [badge]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <section className="glass-card mx-auto max-w-xl p-8 text-center animate-slide-up">
          <div className="mx-auto w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Citizen Login Required</h2>
          <p className="mt-4 text-slate-400">Reporting is currently secured. Please authenticate via the access portal.</p>
          <Link href="/" className="primary-btn mt-8 inline-block px-8">
            Access Portal
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="p-4 py-8 animate-slide-up relative min-h-screen">
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <header className="mb-10 max-w-7xl mx-auto flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Citizen <span className="text-indigo-400">Portal</span></h1>
          <p className="text-slate-400">Welcome back, {session?.reporterName}. Help keep our city safe.</p>
        </div>
        <Link href="/" className="outline-btn text-sm py-2 px-4 shadow-none">Sign Out</Link>
      </header>

      <section className="grid gap-8 mx-auto max-w-7xl lg:grid-cols-[1.3fr_0.7fr] relative z-10">
        <div className="space-y-8">
          <form onSubmit={onSubmit} className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
              <h2 className="text-2xl font-bold text-slate-100">Report an Incident</h2>
            </div>
            <p className="mb-6 text-sm text-slate-400 leading-relaxed">
              Snap a photo and describe the hazard. Our AI triage system will automatically categorize and prioritize it for the relevant department.
            </p>

            <div className="space-y-5">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title (e.g., Deep pothole on Main St)" className="input-field" />
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide specific details about the hazard and precise location directions..." className="input-field h-32 resize-none" />
              
              <div className="group relative">
                <label className="mb-2 block text-sm font-semibold text-slate-400 uppercase tracking-wide">Attach Evidence (Photo)</label>
                <div className="relative rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-800/30 p-6 flex flex-col items-center justify-center transition-all duration-300">
                  <svg className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-slate-400 mb-4 text-center">{imageFile ? imageFile.name : "Click to upload or drag JPG/PNG here"}</span>
                  <input
                    required type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wide">Precise Location</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input required value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Landmark or street area" className="input-field flex-1" />
                  <button type="button" onClick={useCurrentLocation} className="outline-btn whitespace-nowrap flex items-center justify-center gap-2 border-indigo-500/30">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use GPS
                  </button>
                </div>
              </div>
            </div>

            <button disabled={state === "submitting"} className="primary-btn mt-8 w-full py-3.5 text-[15px] tracking-wide relative overflow-hidden group">
              {state === "submitting" ? "Transmitting to Central Grid..." : "Submit Incident Report"}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>

            {state === "success" && (
              <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-emerald-400">Incident successfully merged into live operations array.</p>
              </div>
            )}
            {state === "error" && (
              <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm font-medium text-rose-400">Transmission failure. Please review payload formats and retry.</p>
              </div>
            )}
          </form>

          <section className="glass-card p-8">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Complaint Timeline</h3>
            <p className="text-sm text-slate-400 mb-6">Real-time status updates from the central response array.</p>
            
            <div className="space-y-5">
              {myReports.slice(0, 5).map((report) => (
                <article key={report.id} className="relative rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 group hover:border-indigo-500/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <p className="font-semibold text-slate-200">{report.title}</p>
                    <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute top-2 left-0 right-0 h-0.5 bg-slate-700/50 rounded-full z-0"></div>
                    <div className="relative z-10 flex justify-between">
                      {stages.map((stage, index) => {
                        const currentStageIdx = stages.indexOf(report.timelineStage);
                        const isPast = index < currentStageIdx;
                        const isCurrent = index === currentStageIdx;
                        return (
                          <div key={stage} className="flex flex-col items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${
                              isPast ? "bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" : 
                              isCurrent ? "bg-fuchsia-500 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)] animate-pulse" : 
                              "bg-slate-800 border-slate-600"
                            }`}>
                              {isPast && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                            </div>
                            <span className={`text-[10px] font-medium tracking-wide uppercase ${isCurrent ? "text-fuchsia-400" : isPast ? "text-indigo-300" : "text-slate-500"}`}>
                              {stage.split(' ')[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              ))}
              {myReports.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-slate-700">
                  <p className="text-sm text-slate-500">No telemetry recorded yet. Submit your first report.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="glass-card p-1 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${badgeConfig.tone} opacity-20 blur-xl ${badgeConfig.glow}`}></div>
            <div className={`relative rounded-2xl bg-gradient-to-br ${badgeConfig.tone} p-6 sm:p-8 text-white shadow-xl ${badgeConfig.glow}`}>
              <div className="absolute right-4 top-4 text-4xl opacity-80 mix-blend-overlay animate-float">{badgeConfig.icon}</div>
              <p className="text-sm font-semibold tracking-wide uppercase text-white/80 mb-1">Citizen Ranking</p>
              <p className="text-3xl font-black tracking-tight mb-2 leading-none">{badge}</p>
              <div className="flex items-center gap-2 mt-4 text-sm bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-white/10">
                <span className="font-bold">{helpfulReports}</span>
                <span className="opacity-80">Verified helpful reports</span>
              </div>
            </div>
          </section>

          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-100">Community Clusters</h3>
            </div>
            <p className="mb-6 text-sm text-slate-400">Upvote recognized local clusters to elevate administrative priority.</p>
            
            <div className="space-y-4">
              {clusters.map((cluster) => (
                <article key={cluster.clusterId} className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 transition hover:bg-slate-800/60 group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-200">{cluster.category}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wide mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {cluster.locationLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-400/10 border border-fuchsia-400/20 px-2 py-1 rounded shadow-[0_0_10px_rgba(217,70,239,0.2)]">Sev {cluster.severity}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Reports: {cluster.totalReports} <span className="mx-1">•</span> Votes: {cluster.communityVotes}
                    </p>
                    <button onClick={() => void upvoteCluster(cluster.clusterId)} className="text-xs font-semibold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                      <svg className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      Upvote
                    </button>
                  </div>
                </article>
              ))}
              {clusters.length === 0 && <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-xl">No community clusters active.</p>}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
