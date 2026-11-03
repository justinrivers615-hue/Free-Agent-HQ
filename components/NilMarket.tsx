"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money } from "@/lib/scouting";

type Deal = { id: string; brand_name: string; kind: string; pay_cents: number; description: string; min_followers: number; sport: string | null };

export default function NilMarket({ athleteId, followers, sport, deals, applied }: { athleteId: string; followers: number; sport: string; deals: Deal[]; applied: Record<string, string> }) {
  const [type, setType] = useState("All");
  const router = useRouter();
  const types = ["All", ...Array.from(new Set(deals.map((d) => d.kind)))];
  const list = deals
    .filter((d) => (type === "All" || d.kind === type) && (!d.sport || d.sport === sport))
    .map((d) => ({ ...d, ok: followers >= d.min_followers }))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || b.pay_cents - a.pay_cents);

  async function apply(id: string) {
    const sb = createClient();
    if (applied[id]) await sb.from("nil_applications").delete().eq("deal_id", id).eq("athlete_id", athleteId);
    else await sb.from("nil_applications").insert({ deal_id: id, athlete_id: athleteId });
    router.refresh();
  }

  return (
    <>
      <h3>NIL marketplace</h3>
      <div className="act">{types.map((t) => <button key={t} type="button" className={`btn sm${t === type ? " primary" : ""}`} onClick={() => setType(t)}>{t}</button>)}</div>
      <div className="list">
        {list.length ? list.map((d) => (
          <article className="opp" key={d.id}>
            <div className="match">{money(d.pay_cents)}<small>{d.kind}</small></div>
            <div><h4>{d.brand_name}</h4><div className="d">{d.description}</div>
              <div className="tags"><span className={`tag${d.ok ? "" : " neg"}`}>{d.min_followers ? `${d.min_followers.toLocaleString("en-US")}+ followers` : "No follower minimum"}</span>{d.pay_cents >= 60000 && <span className="tag fee">Report to NIL Go if D1</span>}</div></div>
            <div className="act"><button type="button" className={`btn${applied[d.id] ? "" : " primary"}`} disabled={!d.ok || applied[d.id] === "accepted"} onClick={() => apply(d.id)}>
              {applied[d.id] === "accepted" ? "Accepted" : applied[d.id] === "declined" ? "Declined" : applied[d.id] ? "Withdraw" : d.ok ? "Apply" : "Not eligible"}
            </button></div>
          </article>
        )) : <p className="note">No open deals yet. Brands post them here, and they show up right away.</p>}
      </div>
    </>
  );
}
