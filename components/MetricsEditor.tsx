"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MODELS, percentile, type Sport } from "@/lib/scouting";

export default function MetricsEditor({ userId, sport, initial }: { userId: string; sport: Sport; initial: Record<string, string> }) {
  const defs = MODELS[sport].metrics;
  const [vals, setVals] = useState<Record<string, string>>(initial);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const rows = defs
      .filter((d) => vals[d.key] !== undefined && vals[d.key] !== "" && !Number.isNaN(Number(vals[d.key])))
      .map((d) => ({ athlete_id: userId, key: d.key, value: vals[d.key], percentile: percentile(d, Number(vals[d.key])), source: "self-reported" }));
    const supabase = createClient();
    const cleared = defs.filter((d) => !vals[d.key]).map((d) => d.key);
    if (cleared.length) await supabase.from("athlete_metrics").delete().eq("athlete_id", userId).in("key", cleared);
    const { error } = rows.length ? await supabase.from("athlete_metrics").upsert(rows) : { error: null };
    setMsg(error ? error.message : "Metrics saved. Your report is updated.");
    if (!error) router.refresh();
  }

  return (
    <form className="form" onSubmit={save}>
      {defs.map((d) => (
        <div key={d.key}>
          <label className="lbl" htmlFor={`m-${d.key}`}>{d.label}{d.unit && ` (${d.unit.trim()})`}</label>
          <input id={`m-${d.key}`} type="number" step="any" value={vals[d.key] ?? ""} placeholder={`avg ${d.mean}`} onChange={(e) => setVals({ ...vals, [d.key]: e.target.value })} />
        </div>
      ))}
      <div><button className="btn primary" type="submit">Save metrics</button></div>
      {msg && <p className="note full">{msg}</p>}
    </form>
  );
}
