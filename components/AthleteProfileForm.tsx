"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPORTS } from "@/lib/scouting";

type A = { sport: string; position: string; level: string; school: string; height: string; weight: string; followers: number; engagement: number; division: string; bio: string };
const EMPTY: A = { sport: "Football", position: "", level: "", school: "", height: "", weight: "", followers: 0, engagement: 0, division: "other", bio: "" };

export default function AthleteProfileForm({ userId, initial }: { userId: string; initial: A | null }) {
  const [a, setA] = useState<A>(initial ?? EMPTY);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const set = (k: keyof A) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setA({ ...a, [k]: k === "followers" || k === "engagement" ? Number(e.target.value) : e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await createClient().from("athletes").upsert({ id: userId, ...a, updated_at: new Date().toISOString() });
    setBusy(false);
    setMsg(error ? error.message : "Profile saved.");
    if (!error) router.refresh();
  }

  return (
    <form className="form" onSubmit={save}>
      <div><label className="lbl" htmlFor="sport">Sport</label><select id="sport" value={a.sport} onChange={set("sport")} disabled={!!initial}>{SPORTS.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div><label className="lbl" htmlFor="position">Position</label><input id="position" value={a.position} onChange={set("position")} placeholder="WR" /></div>
      <div><label className="lbl" htmlFor="level">Level</label><input id="level" value={a.level} onChange={set("level")} placeholder="Div II senior" /></div>
      <div><label className="lbl" htmlFor="division">School / status</label>
        <select id="division" value={a.division} onChange={set("division")}>
          <option value="d1">NCAA Division I</option><option value="ncaa">NCAA D2 / D3</option><option value="other">NAIA / JUCO / HS</option><option value="pro">Out of school / pro</option>
        </select></div>
      <div><label className="lbl" htmlFor="school">School or last team</label><input id="school" value={a.school} onChange={set("school")} /></div>
      <div><label className="lbl" htmlFor="height">Height</label><input id="height" value={a.height} onChange={set("height")} placeholder={`6'2"`} /></div>
      <div><label className="lbl" htmlFor="weight">Weight</label><input id="weight" value={a.weight} onChange={set("weight")} placeholder="205 lb" /></div>
      <div><label className="lbl" htmlFor="followers">Social followers</label><input id="followers" type="number" min={0} value={a.followers} onChange={set("followers")} /></div>
      <div><label className="lbl" htmlFor="engagement">Engagement rate %</label><input id="engagement" type="number" min={0} step="0.1" value={a.engagement} onChange={set("engagement")} /></div>
      <div className="full"><label className="lbl" htmlFor="bio">About you</label><textarea id="bio" value={a.bio} onChange={set("bio")} /></div>
      <div><button className="btn primary" disabled={busy} type="submit">{initial ? "Save profile" : "Create profile"}</button></div>
      {msg && <p className="note full">{msg}</p>}
    </form>
  );
}
