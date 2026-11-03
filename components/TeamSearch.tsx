"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { band, fit, MODELS, type Sport } from "@/lib/scouting";

export type Prospect = {
  id: string; name: string; position: string; level: string; school: string; size: string; followers: number;
  latest: { season: string; stats: Record<string, string> } | null;
  metrics: { key: string; value: string; percentile: number }[];
};

export default function TeamSearch({ orgId, sport, prospects, onBoard }: { orgId: string; sport: Sport; prospects: Prospect[]; onBoard: string[] }) {
  const model = MODELS[sport];
  const [scheme, setScheme] = useState(0);
  const [min, setMin] = useState(0);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [board, setBoard] = useState(new Set(onBoard));
  const router = useRouter();
  const label = Object.fromEntries(model.metrics.map((m) => [m.key, m.label]));

  const rows = useMemo(() => prospects
    .map((p) => { const pcts = Object.fromEntries(p.metrics.map((m) => [m.key, m.percentile])); return { ...p, pcts, f: fit(model.schemes[scheme], pcts) }; })
    .filter((p) => (p.f ?? 0) >= min && (q === "" || `${p.name} ${p.position} ${p.level} ${p.school}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.f ?? -1) - (a.f ?? -1)), [prospects, scheme, min, q, model]);

  async function add(id: string) {
    const { error } = await createClient().from("board_entries").insert({ org_id: orgId, athlete_id: id, stage: 0 });
    if (!error) { setBoard(new Set(board).add(id)); router.refresh(); }
  }

  return (
    <>
      <h3>Find players for your system</h3>
      <div className="form">
        <div><label className="lbl" htmlFor="sys">Our play style</label><select id="sys" value={scheme} onChange={(e) => setScheme(Number(e.target.value))}>{model.schemes.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}</select></div>
        <div><label className="lbl" htmlFor="min">Minimum fit: {min}%</label><input id="min" type="range" min={0} max={90} step={5} value={min} onChange={(e) => setMin(Number(e.target.value))} /></div>
        <div><label className="lbl" htmlFor="q">Name, school or level</label><input id="q" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      <p className="lead">{model.schemes[scheme].description}</p>
      <div className="list">
        {rows.length ? rows.map((p) => {
          const ks = Object.keys(p.pcts).sort((a, b) => p.pcts[b] - p.pcts[a]);
          return (
            <article className="opp" key={p.id}>
              <div className="match">{p.f ?? "–"}<small>fit</small></div>
              <div>
                <h4>{p.name}</h4>
                <div className="d">{[p.position, p.level, p.school, p.size].filter(Boolean).join(" · ")}{p.latest && ` · ${p.latest.season}: ${Object.entries(p.latest.stats).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(", ")}`}</div>
                {ks.length > 0 && <div className="tags"><span className="tag">+ {label[ks[0]]}</span>{ks[1] && <span className="tag">+ {label[ks[1]]}</span>}{ks.length > 2 && <span className="tag neg">− {label[ks[ks.length - 1]]}</span>}</div>}
                {!ks.length && <p className="note">No game metrics yet.</p>}
                {open === p.id && <div className="metrics" style={{ marginTop: 12 }}>{ks.map((k) => (
                  <div className="metric" key={k}><span>{label[k]}</span><span className="v">{p.metrics.find((m) => m.key === k)?.value}</span><div className="track"><div className={`fill ${band(p.pcts[k])}`} style={{ width: `${p.pcts[k]}%` }} /></div><small>Percentile {p.pcts[k]}</small></div>
                ))}</div>}
              </div>
              <div className="act">
                <button className="btn" type="button" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? "Hide report" : "Report"}</button>
                <button className="btn" type="button" disabled={board.has(p.id)} onClick={() => add(p.id)}>{board.has(p.id) ? "On board" : "Add to board"}</button>
              </div>
            </article>
          );
        }) : <p className="note">{prospects.length ? "No athletes match. Lower the minimum fit or clear the search." : `No ${sport.toLowerCase()} athletes have joined yet.`}</p>}
      </div>
    </>
  );
}
