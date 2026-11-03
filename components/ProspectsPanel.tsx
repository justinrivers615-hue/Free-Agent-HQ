"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type ProspectRow = {
  id: string; org_id: string | null; full_name: string; position: string; school: string; division: string;
  class_year: string; hometown: string; stats: Record<string, string>; source: string; athlete_id: string | null;
};

const BASE = ["full_name", "position", "school", "division", "class_year", "hometown"];

// Minimal CSV parser: handles quoted fields, commas and newlines inside quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

export default function ProspectsPanel({ orgId, sport, userId, prospects, onList }: {
  orgId: string; sport: string; userId: string; prospects: ProspectRow[]; onList: string[];
}) {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | "ours" | "pool">("all");
  const [listed, setListed] = useState(new Set(onList));
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const rows = useMemo(() => prospects
    .filter((p) => scope === "all" || (scope === "ours" ? p.org_id === orgId : p.org_id === null))
    .filter((p) => q === "" || `${p.full_name} ${p.position} ${p.school} ${p.division} ${p.class_year} ${p.hometown}`.toLowerCase().includes(q.toLowerCase())),
    [prospects, scope, q, orgId]);

  async function addToList(id: string) {
    const { error } = await createClient().from("scout_list").insert({ org_id: orgId, prospect_id: id, added_by: userId });
    if (!error) { setListed(new Set(listed).add(id)); router.refresh(); }
  }

  async function importCsv() {
    setMsg("");
    const data = parseCsv(csv.trim());
    if (data.length < 2) return setMsg("Paste a header row and at least one player.");
    const header = data[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const nameIdx = header.findIndex((h) => h === "full_name" || h === "name");
    if (nameIdx < 0) return setMsg("Your header row needs a name or full_name column.");
    if (data.length - 1 > 2000) return setMsg("Import up to 2,000 players at a time.");
    const records = data.slice(1).map((r) => {
      const rec: Record<string, unknown> = { org_id: orgId, sport, created_by: userId, source: "team import" };
      const stats: Record<string, string> = {};
      header.forEach((h, i) => {
        const v = (r[i] ?? "").trim();
        if (i === nameIdx) rec.full_name = v;
        else if (BASE.includes(h)) rec[h] = v;
        else if (h && v) stats[h] = v;
      });
      rec.stats = stats;
      return rec;
    }).filter((r) => r.full_name);
    setBusy(true);
    const sb = createClient();
    let done = 0;
    for (let i = 0; i < records.length; i += 500) {
      const { error } = await sb.from("prospects").insert(records.slice(i, i + 500));
      if (error) { setBusy(false); return setMsg(`Stopped after ${done} players: ${error.message}`); }
      done += Math.min(500, records.length - i);
    }
    setBusy(false);
    setCsv("");
    setMsg(`Imported ${done} prospects. Only your staff can see them.`);
    router.refresh();
  }

  async function removeOurs(id: string) {
    await createClient().from("prospects").delete().eq("id", id).eq("org_id", orgId);
    router.refresh();
  }

  return (
    <>
      <h3>Prospects</h3>
      <p className="lead">Players who haven&apos;t joined Free Agent HQ yet. Add the ones you&apos;re tracking to your Scouts list. When a player creates an account and claims their profile, you can move them onto your big board.</p>
      <div className="form">
        <div><label className="lbl" htmlFor="pq">Search</label><input id="pq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, school, position, class" /></div>
        <div><label className="lbl" htmlFor="ps">Show</label><select id="ps" value={scope} onChange={(e) => setScope(e.target.value as "all" | "ours" | "pool")}><option value="all">All prospects</option><option value="ours">Our imported list</option><option value="pool">Free Agent HQ pool</option></select></div>
      </div>
      <div className="list">
        {rows.length ? rows.slice(0, 200).map((p) => (
          <article className="opp" key={p.id}>
            <div className="match">{p.class_year || "–"}<small>class</small></div>
            <div>
              <h4>{p.full_name}</h4>
              <div className="d">{[p.position, p.school, p.division, p.hometown].filter(Boolean).join(" · ")}</div>
              <div className="tags">
                <span className="tag">{p.org_id ? "Our list" : "Shared pool"}</span>
                {p.athlete_id && <span className="tag fee">On Free Agent HQ</span>}
                {Object.entries(p.stats).slice(0, 4).map(([k, v]) => <span className="tag" key={k}>{k.replace(/_/g, " ")}: {v}</span>)}
              </div>
            </div>
            <div className="act">
              <button className="btn" type="button" disabled={listed.has(p.id)} onClick={() => addToList(p.id)}>{listed.has(p.id) ? "On Scouts list" : "Add to Scouts list"}</button>
              {p.org_id === orgId && <button className="link" type="button" onClick={() => removeOurs(p.id)}>Delete</button>}
            </div>
          </article>
        )) : <p className="note">{prospects.length ? "No prospects match your search." : "No prospects yet. Import your own list below. The shared pool fills as licensed college data is added."}</p>}
        {rows.length > 200 && <p className="note">Showing the first 200 of {rows.length}. Search to narrow the list.</p>}
      </div>

      <p className="sub">Import your prospect list</p>
      <p className="lead">Paste a CSV from your own scouting files. Needs a <code>name</code> column. <code>position</code>, <code>school</code>, <code>division</code>, <code>class_year</code> and <code>hometown</code> are recognized, and every other column is saved as a stat. Imports are private to your team.</p>
      <textarea id="pcsv" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"name,position,school,division,class_year,forty,rec_yds\nJordan Example,WR,State University,FCS,Senior,4.52,1031"} style={{ fontFamily: "var(--mono)", fontSize: 13, minHeight: 140 }} />
      <div className="act">
        <label className="btn" htmlFor="pfile">Choose CSV file</label>
        <input id="pfile" type="file" accept=".csv,text/csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} />
        <button className="btn primary" type="button" disabled={busy || !csv.trim()} onClick={importCsv}>{busy ? "Importing…" : "Import prospects"}</button>
      </div>
      {msg && <p className="note">{msg}</p>}
      <p className="note">Only import players you have the right to use, such as your own evaluations or data you licensed. Don&apos;t paste data copied from sites whose terms forbid it.</p>
    </>
  );
}
