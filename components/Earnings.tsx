"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money } from "@/lib/scouting";

type Row = { id: string; brand: string; kind: string; amount_cents: number; paid_on: string; reporting: string };

export default function Earnings({ athleteId, rows }: { athleteId: string; rows: Row[] }) {
  const [f, setF] = useState({ brand: "", kind: "Social post", amount: "", paid_on: new Date().toISOString().slice(0, 10), reporting: "not required" });
  const router = useRouter();
  const total = rows.reduce((s, r) => s + r.amount_cents, 0);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().from("earnings").insert({ athlete_id: athleteId, brand: f.brand, kind: f.kind, amount_cents: Math.round(Number(f.amount) * 100), paid_on: f.paid_on, reporting: f.reporting });
    if (!error) { setF({ ...f, brand: "", amount: "" }); router.refresh(); }
  }
  return (
    <>
      <h3>Earnings &amp; taxes</h3>
      <div className="two">
        <div className="summary"><span className="note">Earned</span><div className="h3">{money(total)}</div></div>
        <div className="summary"><span className="note">Set aside for taxes (~28%)</span><div className="h3">{money(total * 0.28)}</div></div>
        <div className="summary"><span className="note">Safe to spend</span><div className="h3">{money(total * 0.72)}</div></div>
      </div>
      <div className="tbl"><table>
        <thead><tr><th scope="col">Date</th><th scope="col" style={{ textAlign: "left" }}>Brand</th><th scope="col" style={{ textAlign: "left" }}>Type</th><th scope="col">Paid</th><th scope="col">Reporting</th></tr></thead>
        <tbody>{rows.length ? rows.map((r) => <tr key={r.id}><td>{r.paid_on}</td><td style={{ textAlign: "left" }}>{r.brand}</td><td style={{ textAlign: "left" }}>{r.kind}</td><td>{money(r.amount_cents)}</td><td>{r.reporting}</td></tr>) : <tr><td colSpan={5} className="note">No earnings logged yet.</td></tr>}</tbody>
      </table></div>
      <form className="form" onSubmit={add}>
        <div><label className="lbl" htmlFor="eb">Brand</label><input id="eb" required value={f.brand} onChange={set("brand")} /></div>
        <div><label className="lbl" htmlFor="ek">Type</label><select id="ek" value={f.kind} onChange={set("kind")}><option>Social post</option><option>Appearance</option><option>Camp / clinic</option><option>Licensing</option><option>Revenue share</option></select></div>
        <div><label className="lbl" htmlFor="ea">Amount ($)</label><input id="ea" type="number" min={0} step="0.01" required value={f.amount} onChange={set("amount")} /></div>
        <div><label className="lbl" htmlFor="ed">Paid on</label><input id="ed" type="date" value={f.paid_on} onChange={set("paid_on")} /></div>
        <div><label className="lbl" htmlFor="er">Reporting</label><select id="er" value={f.reporting} onChange={set("reporting")}><option value="not required">Not required</option><option value="pending">Pending</option><option value="reported">Reported</option></select></div>
        <div><button className="btn primary" type="submit">Log payment</button></div>
      </form>
      <p className="note">NIL pay is usually self-employment income reported on a 1099. The 28% set-aside is a planning estimate, not tax advice.</p>
    </>
  );
}
