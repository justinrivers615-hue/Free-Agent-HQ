"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { money, SPORTS } from "@/lib/scouting";

type App = { athlete_id: string; status: string; athletes: { sport: string; position: string; level: string; followers: number; profiles: { full_name: string } | null } | null };
type Deal = { id: string; brand_name: string; kind: string; pay_cents: number; description: string; min_followers: number; sport: string | null; status: string; nil_applications: App[] };

export default function BrandDeals({ userId, brandName, deals }: { userId: string; brandName: string; deals: Deal[] }) {
  const [f, setF] = useState({ brand_name: brandName, kind: "Social post", pay: "400", min: "3000", sport: "", description: "" });
  const [err, setErr] = useState("");
  const router = useRouter();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function post(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().from("nil_deals").insert({ brand_user_id: userId, brand_name: f.brand_name, kind: f.kind, pay_cents: Math.round(Number(f.pay) * 100), min_followers: Number(f.min) || 0, sport: f.sport || null, description: f.description });
    setErr(error ? error.message : "");
    if (!error) { setF({ ...f, description: "" }); router.refresh(); }
  }
  async function decide(dealId: string, athleteId: string, status: string) {
    await createClient().from("nil_applications").update({ status }).eq("deal_id", dealId).eq("athlete_id", athleteId);
    router.refresh();
  }
  async function toggle(d: Deal) {
    await createClient().from("nil_deals").update({ status: d.status === "open" ? "closed" : "open" }).eq("id", d.id);
    router.refresh();
  }
  return (
    <>
      <section className="card panel">
        <h3>Post a deal</h3>
        <form className="form" onSubmit={post}>
          <div><label className="lbl" htmlFor="bn">Business name</label><input id="bn" required value={f.brand_name} onChange={set("brand_name")} /></div>
          <div><label className="lbl" htmlFor="bk">Deal type</label><select id="bk" value={f.kind} onChange={set("kind")}><option>Social post</option><option>Appearance</option><option>Camp / clinic</option><option>Licensing</option></select></div>
          <div><label className="lbl" htmlFor="bp">Pay ($)</label><input id="bp" type="number" min={1} required value={f.pay} onChange={set("pay")} /></div>
          <div><label className="lbl" htmlFor="bm">Minimum followers</label><input id="bm" type="number" min={0} value={f.min} onChange={set("min")} /></div>
          <div><label className="lbl" htmlFor="bs">Sport</label><select id="bs" value={f.sport} onChange={set("sport")}><option value="">Any sport</option>{SPORTS.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="full"><label className="lbl" htmlFor="bd">What the athlete does</label><input id="bd" required value={f.description} onChange={set("description")} placeholder="One Instagram post and a story on game day." /></div>
          <div><button className="btn primary" type="submit">Post deal</button></div>
          {err && <p className="err full">{err}</p>}
        </form>
      </section>
      <section className="card panel">
        <h3>Your deals</h3>
        {deals.length ? deals.map((d) => (
          <div key={d.id} className="list" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <div className="act" style={{ justifyContent: "space-between" }}><span><b>{money(d.pay_cents)} · {d.kind}</b> <span className="d">— {d.description}</span></span><button className="btn sm" type="button" onClick={() => toggle(d)}>{d.status === "open" ? "Close deal" : "Reopen"}</button></div>
            {d.nil_applications.length ? d.nil_applications.map((a) => (
              <div className="opp" key={a.athlete_id} style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                <div><h4>{a.athletes?.profiles?.full_name || "Athlete"}</h4><div className="d">{[a.athletes?.sport, a.athletes?.position, a.athletes?.level].filter(Boolean).join(" · ")} · {(a.athletes?.followers ?? 0).toLocaleString("en-US")} followers</div></div>
                <div className="act">{a.status === "applied" ? <><button className="btn sm primary" type="button" onClick={() => decide(d.id, a.athlete_id, "accepted")}>Accept</button><button className="btn sm" type="button" onClick={() => decide(d.id, a.athlete_id, "declined")}>Decline</button></> : <span className="status">{a.status}</span>}</div>
              </div>
            )) : <p className="note">No applications yet.</p>}
          </div>
        )) : <p className="note">You haven't posted a deal yet.</p>}
      </section>
    </>
  );
}
