"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ReportPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [imageName, setImageName] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [state, setState] = useState<SubmitState>("idle");

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
    setState("submitting");

    const response = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, locationLabel, imageName, latitude, longitude })
    });

    if (!response.ok) {
      setState("error");
      return;
    }

    setTitle("");
    setDescription("");
    setLocationLabel("");
    setImageName("");
    setLatitude(undefined);
    setLongitude(undefined);
    setState("success");
  };

  return (
    <section className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Report a Civic Issue</h2>
        <p className="mt-2 text-sm text-slate-600">Submit hazards in under 30 seconds. AI triage handles categorization and urgency.</p>

        <div className="mt-6 space-y-4">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue title (e.g., Huge pothole near school)" className="w-full rounded-md border border-slate-300 px-3 py-2" />
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened..." className="h-28 w-full rounded-md border border-slate-300 px-3 py-2" />
          <input value={imageName} onChange={(e) => setImageName(e.target.value)} placeholder="Image filename (simulated upload)" className="w-full rounded-md border border-slate-300 px-3 py-2" />

          <div className="space-y-2">
            <input required value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="Location (landmark/street)" className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <button type="button" onClick={useCurrentLocation} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Use current geolocation
            </button>
          </div>
        </div>

        <button disabled={state === "submitting"} className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
          {state === "submitting" ? "Submitting..." : "Submit Issue"}
        </button>

        {state === "success" && <p className="mt-3 text-sm font-medium text-emerald-600">Issue submitted. AI triage has routed it to the right department.</p>}
        {state === "error" && <p className="mt-3 text-sm font-medium text-rose-600">Submission failed. Please check fields and try again.</p>}
      </form>

      <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold">How CivicSense AI helps</h3>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li>• Vision-AI style triage simulation for fast category detection.</li>
          <li>• Severity scoring (1-10) to prioritize dangerous issues first.</li>
          <li>• Instant routing to the relevant municipal department.</li>
          <li>• Live admin dashboard for status tracking and accountability.</li>
        </ul>
      </aside>
    </section>
  );
}
