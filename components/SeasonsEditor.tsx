"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Season = { id: number; season: string; stats: Record<string, string> };

export default function SeasonsEditor({ userId, columns, seasons, editable }: { userId: string; columns: string[]; seasons: Season[]; editable: boolean }) {
  const [season, setSeason] = useState("");
  const [stats, setStats] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().from("athlete_seasons").upsert({ athlete_id: userId, season, stats }, { onConflict: "athlete_id,season" });
    setMsg(error ? error.message : "");
    if (!error) { setSeason(""); setStats({}); router.refresh(); }
  }
  async function remove(id: number) {
    await createClient().from("athlete_seasons").delete().eq("id", id);
    router.refresh();
  }

  return (
    <>
      <div className="tbl">
        <table>
          <thead><tr><th scope="col">Season</th>{columns.map((c) => <th scope="col" key={c}>{c}</th>)}{editable && <th scope="col"></th>}</tr></thead>
          <tbody>
            {seasons.length ? seasons.map((s) => (
              <tr key={s.id}><td>{s.season}</td>{columns.map((c) => <td key={c}>{s.stats[c] ?? "–"}</td>)}{editable && <td><button className="link" type="button" onClick={() => remove(s.id)}>Remove</button></td>}</tr>
            )) : <tr><td colSpan={columns.length + 2} className="note">No seasons added yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {editable && (
        <form className="form" onSubmit={add}>
          <div><label className="lbl" htmlFor="season">Season</label><input id="season" required value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2025" /></div>
          {columns.map((c) => (
            <div key={c}><label className="lbl" htmlFor={`s-${c}`}>{c}</label><input id={`s-${c}`} value={stats[c] ?? ""} onChange={(e) => setStats({ ...stats, [c]: e.target.value })} /></div>
          ))}
          <div><button className="btn" type="submit">Add season</button></div>
          {msg && <p className="err full">{msg}</p>}
        </form>
      )}
    </>
  );
}
