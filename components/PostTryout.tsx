"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PostTryout({ orgId, sport, userId, canPost, tryouts }: { orgId: string; sport: string; userId: string; canPost: boolean; tryouts: { id: string; title: string; starts_on: string | null; location: string }[] }) {
  const [f, setF] = useState({ title: "", kind: "Open tryout", location: "", starts_on: "", fee: "0", description: "" });
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function post(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().from("opportunities").insert({
      org_id: orgId, created_by: userId, sport, kind: f.kind, title: f.title, location: f.location,
      starts_on: f.starts_on || null, fee_cents: Math.round(Number(f.fee) * 100), description: f.description,
    });
    setMsg(error ? error.message : "Posted. Every athlete in your sport can see it.");
    if (!error) router.refresh();
  }
  async function remove(id: string) {
    await createClient().from("opportunities").delete().eq("id", id);
    router.refresh();
  }
  return (
    <>
      <h3>Tryouts</h3>
      <div className="staff">
        {tryouts.length ? tryouts.map((t) => <div key={t.id}><span><b>{t.title}</b> <small className="note">· {t.starts_on ?? "Date TBA"} · {t.location}</small></span>{canPost && <button className="link" type="button" onClick={() => remove(t.id)}>Remove</button>}</div>) : <p className="note">No tryouts posted yet.</p>}
      </div>
      {canPost ? (
        <form className="form" onSubmit={post}>
          <div><label className="lbl" htmlFor="tt">Title</label><input id="tt" required value={f.title} onChange={set("title")} placeholder="Spring open tryout" /></div>
          <div><label className="lbl" htmlFor="tk">Type</label><select id="tk" value={f.kind} onChange={set("kind")}><option>Open tryout</option><option>Private workout</option><option>Showcase</option><option>Combine</option><option>Free-agent camp</option></select></div>
          <div><label className="lbl" htmlFor="tl">Location</label><input id="tl" value={f.location} onChange={set("location")} /></div>
          <div><label className="lbl" htmlFor="td">Date</label><input id="td" type="date" value={f.starts_on} onChange={set("starts_on")} /></div>
          <div><label className="lbl" htmlFor="tf">Fee ($)</label><input id="tf" type="number" min={0} value={f.fee} onChange={set("fee")} /></div>
          <div className="full"><label className="lbl" htmlFor="tdesc">Details</label><input id="tdesc" value={f.description} onChange={set("description")} placeholder="Positions needed, what to bring" /></div>
          <div><button className="btn primary" type="submit">Post tryout</button></div>
          {msg && <p className="note full">{msg}</p>}
        </form>
      ) : <p className="note">Only the GM or head coach can post tryouts.</p>}
    </>
  );
}
