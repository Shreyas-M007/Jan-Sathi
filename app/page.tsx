"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Mode = "login" | "register";
type Role = "Citizen" | "Admin";

const liveStats = [
  { label: "Issues reported today", value: "128" },
  { label: "Avg. triage time", value: "< 25 sec" },
  { label: "High-risk alerts routed", value: "34" }
];

export default function AuthPage() {
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

  const destination = role === "Citizen" ? "/report" : "/admin";
  const submitLabel = mode === "login" ? `Login as ${role}` : `Register as ${role}`;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.05fr_0.95fr]">
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Welcome to CivicSense AI</h2>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">Live {clock}</span>
        </div>
        <p className="text-sm text-slate-600">Choose your access mode, then continue as a citizen reporter or municipal admin.</p>

        <div className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-100 to-fuchsia-100 p-1">
          {(["login", "register"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === item ? "bg-white text-slate-900 shadow" : "text-slate-600"
              }`}
            >
              {item === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2" />
          )}
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2" />
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-md border border-indigo-200 bg-white/90 px-3 py-2" />

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Continue as</p>
            <div className="flex gap-3">
              {(["Citizen", "Admin"] as Role[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    role === item ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white" : "outline-btn"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <Link href={destination} className="primary-btn block w-full text-center">
            {submitLabel}
          </Link>
        </form>
      </div>

      <aside className="glass-card p-6">
        <h3 className="text-xl font-semibold">Live platform pulse</h3>
        <div className="mt-4 grid gap-3">
          {liveStats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-indigo-100 bg-gradient-to-r from-white to-indigo-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className="mt-1 text-lg font-bold text-indigo-700">{stat.value}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
