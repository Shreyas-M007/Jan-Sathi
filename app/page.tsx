"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";
type Role = "Citizen" | "Admin";

const liveStats = [
  { label: "Issues reported today", value: "128", trend: "+12%" },
  { label: "Avg. triage time", value: "< 2.5s", trend: "Fast" },
  { label: "High-risk alerts routed", value: "34", trend: "Critical" }
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("Citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const submitLabel = mode === "login" ? `Access ${role} Portal` : `Join as ${role}`;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const reporterName = name || email.split("@")[0] || "Citizen";
    const reporterId = email.toLowerCase().trim() || `citizen-${crypto.randomUUID()}`;

    localStorage.setItem(
      "jan-sathi-session",
      JSON.stringify({
        role,
        email,
        reporterName,
        reporterId,
        loggedIn: true
      })
    );

    router.push(role === "Citizen" ? "/report" : "/admin");
  };

  return (
    <div className="relative flex min-h-[90vh] items-center justify-center p-4 py-12">
      {/* Background ambient glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-glow"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[150px] mix-blend-screen animate-float"></div>
      </div>

      <section className="animate-slide-up z-10 mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-8 md:p-10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full"></div>
          
          <div className="mb-6 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/40">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Jan Sathi</h2>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              {clock}
            </span>
          </div>
          <p className="text-slate-400 mb-8 leading-relaxed relative z-10">
            Welcome to the AI-driven unified civic intelligence platform. Select your role to continue.
          </p>

          <div className="mb-8 inline-flex w-fit rounded-xl bg-slate-900/80 p-1.5 border border-slate-700/50 backdrop-blur-md relative z-10">
            {(["login", "register"] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`relative rounded-lg px-6 py-2 text-sm font-medium transition-all duration-300 ${
                  mode === item 
                    ? "text-white shadow-lg shadow-black/20" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {mode === item && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 border border-white/10 z-0"></div>
                )}
                <span className="relative z-10">{item === "login" ? "Sign In" : "Create Account"}</span>
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-5 relative z-10">
            {mode === "register" && (
              <div className="animate-slide-up">
                <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="input-field" />
              </div>
            )}
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="input-field" />
            <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="input-field" />

            <div className="pt-2">
              <p className="mb-3 text-sm font-semibold text-slate-400 tracking-wide uppercase">Access Level</p>
              <div className="flex gap-4">
                {(["Citizen", "Admin"] as Role[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`flex-1 rounded-xl py-3.5 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      role === item 
                        ? "bg-gradient-to-r from-indigo-600/80 to-fuchsia-600/80 text-white border border-indigo-400/30 shadow-lg shadow-indigo-600/20" 
                        : "bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {item === "Citizen" ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="primary-btn mt-6 block w-full text-center text-[15px] tracking-wide py-3.5">
              {submitLabel}
            </button>
          </form>
        </div>

        <aside className="glass-card p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
              <h3 className="text-xl font-bold text-slate-100">System Telemetry</h3>
            </div>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Live automated tracking of global instances monitored by the central grid.
            </p>
            <div className="grid gap-4">
              {liveStats.map((stat) => (
                <div key={stat.label} className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 transition-all duration-300 hover:bg-slate-800/60 hover:border-indigo-500/30 hover:-translate-y-0.5">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-fuchsia-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">{stat.value}</p>
                    </div>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-400/20">{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/5 p-5 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/20 blur-xl rounded-full"></div>
            <h4 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2 relative z-10">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Gemini AI Active
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed relative z-10">
              Jan Sathi utilizes state-of-the-art multimodal AI models to automatically triage incident images and text, immediately assigning severe cases.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
