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
    if (!response.ok) return;

    const data = (await response.json()) as { issues: CivicIssue[]; clusters: IssueCluster[]; hotspots: Hotspot[] };
    setIssues(data.issues);
    setClusters(data.clusters);
    setHotspots(data.hotspots);
    setLoading(false);
  };

  useEffect(() => {
    const raw = localStorage.getItem("jan-sathi-session");
    if (!raw) return;

    const parsed = JSON.parse(raw) as Session;
    setAuthorized(Boolean(parsed.loggedIn && parsed.role === "Admin"));
  }, []);

  useEffect(() => {
    if (!authorized) return;

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
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <section className="glass-card mx-auto max-w-xl p-8 text-center animate-slide-up">
          <div className="mx-auto w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Admin Login Required</h2>
          <p className="mt-4 text-slate-400">Please authenticate to access the municipal deployment grid.</p>
          <Link href="/" className="primary-btn mt-8 inline-block px-8">
            Access Portal
          </Link>
        </section>
      </div>
    );
  }

  if (!granted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <section className="glass-card mx-auto max-w-md p-8 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]"></div>
          <h2 className="text-2xl font-bold text-white">Grid Access Validation</h2>
          <p className="mt-3 text-sm text-slate-400">Input your administrative cryptographic passkey to unlock the command center.</p>
          <div className="mt-6 relative">
            <svg className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            <input
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Enter Access Key: protocol-demo"
              className="input-field pl-10 h-14"
            />
          </div>
          <button onClick={() => setGranted(accessCode === dashboardKey)} className="primary-btn mt-6 w-full py-3.5 text-[15px] font-bold tracking-wide">
            INITIALIZE UPLINK
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="p-4 py-8 animate-slide-up relative min-h-screen">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <header className="mb-10 max-w-[90rem] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wide flex items-center gap-3">
            <div className="h-6 w-1.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]"></div>
            Municipal <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Command Center</span>
          </h1>
          <p className="text-slate-400 font-medium">Clustered telemetry + predictive hotspot routing for optimal asset deployment.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            SYSTEM ONLINE
          </div>
          <Link href="/" className="outline-btn text-sm py-2 shadow-none border-slate-700 hover:border-slate-500 hover:bg-slate-800 text-slate-300">Logout</Link>
        </div>
      </header>

      <div className="max-w-[90rem] mx-auto grid gap-6 xl:grid-cols-[1fr_2fr] relative z-10">
        
        {/* Left Col: Diagnostics */}
        <aside className="space-y-6 flex flex-col h-full">
          {/* Heat map */}
          <section className="glass-card p-6 flex-none relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none"></div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Critical Hotspots
            </h3>
            <div className="grid gap-3">
              {hotspots.map((spot, i) => (
                <div key={spot.area} className={`rounded-xl border p-4 flex items-center justify-between ${
                  i === 0 ? "bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] relative overflow-hidden group" : "bg-slate-800/40 border-slate-700/50"
                }`}>
                  {i === 0 && <div className="absolute inset-0 border-l-2 border-rose-500 animate-pulse"></div>}
                  <div className="relative z-10">
                    <p className={`font-bold ${i === 0 ? "text-rose-200" : "text-slate-200"}`}>{spot.area}</p>
                    <p className={`text-xs uppercase tracking-wide ${i === 0 ? "text-rose-400/80" : "text-slate-500"}`}>Unresolved Density</p>
                  </div>
                  <div className={`text-2xl font-black ${i === 0 ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "text-slate-300"}`}>
                    {spot.count}
                  </div>
                </div>
              ))}
              {hotspots.length === 0 && <p className="text-sm text-slate-500 text-center py-4 rounded-xl border border-dashed border-slate-700">No critical anomalies detected.</p>}
            </div>
          </section>

          {/* Clusters */}
          <section className="glass-card p-6 flex-1 flex flex-col relative overflow-hidden">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              AI Deduplicated Clusters
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">System merges proximal citizen reports into actionable deployment nodes based on severity and upvotes.</p>
            
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                {sortedClusters.map((cluster) => (
                  <article key={cluster.clusterId} className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 transition-colors hover:bg-slate-800/80 group">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-slate-100">{cluster.category}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 uppercase tracking-wider">
                           <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {cluster.locationLabel}
                        </p>
                      </div>
                      <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 text-xs font-bold text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)] whitespace-nowrap">
                        SEV <span className="text-indigo-100">{cluster.severity}</span> <span className="mx-1 opacity-40">|</span> VTS <span className="text-indigo-100">{cluster.communityVotes}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${cluster.unresolvedCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}></span>
                       <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold"><strong className="text-slate-300">{cluster.totalReports}</strong> Merged Reports <span className="mx-1">•</span> <strong className={cluster.unresolvedCount > 0 ? "text-rose-400" : "text-emerald-400"}>{cluster.unresolvedCount}</strong> Unresolved</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>

        {/* Right Col: Underlying Tickets */}
        <section className="glass-card p-6 flex flex-col min-h-[70vh] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <h3 className="text-xl font-black text-slate-100 flex items-center gap-3 mb-6 tracking-wide uppercase">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Live Ticket Feed
          </h3>
          
          <div className="mt-2 space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-6 flex-1">
            {issues.map((issue) => {
               // Determine dynamic UI mappings based on status
               const isResolved = issue.status === "Resolved";
               const isInProgress = issue.status === "In Progress";
               
               const statusColorClass = isResolved 
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                  : isInProgress 
                     ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
                     : "text-rose-400 bg-rose-500/10 border-rose-500/20";
               
               const stageColorClass = isResolved 
                  ? "text-emerald-300" 
                  : isInProgress ? "text-amber-300" : "text-indigo-300";

              return (
              <article key={issue.id} className={`rounded-xl border p-5 ${isResolved ? "bg-slate-900/40 border-slate-800" : "bg-slate-800/40 border-slate-700/60"} transition-all duration-300`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-[70%]">
                    <h4 className={`text-lg font-bold ${isResolved ? "text-slate-400 line-through decoration-slate-600/50" : "text-white"}`}>{issue.title}</h4>
                    <p className={`text-sm mt-1 mb-2 ${isResolved ? "text-slate-500" : "text-slate-400"}`}>{issue.description.length > 100 ? `${issue.description.substring(0, 100)}...` : issue.description}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-1">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {issue.locationLabel}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Reported by {issue.reporterName}</p>
                    </div>
                  </div>
                  <div className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${statusColorClass} shadow-sm`}>
                    {issue.status}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Timeline Stage:</span>
                     <span className={`text-xs font-bold uppercase tracking-wide bg-slate-900/50 px-2 py-1 rounded border border-slate-700 ${stageColorClass}`}>{issue.timelineStage}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => void updateStatus(issue.id, status)}
                        className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                          status === issue.status 
                            ? "bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 border border-indigo-400/50 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]" 
                            : "border border-slate-600 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-700"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                    {!isResolved && (
                      <button 
                         className="outline-btn text-xs font-bold uppercase tracking-wider py-2 px-4 shadow-none bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 flex items-center gap-1" 
                         onClick={() => void advanceTimeline(issue.id)}
                      >
                        Advance State
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )})}
            {issues.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Grid feed empty. No telemetry on file.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}
