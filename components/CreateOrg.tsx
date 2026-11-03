"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SPORTS } from "@/lib/scouting";

export default function CreateOrg({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("Football");
  const [err, setErr] = useState("");
  const router = useRouter();
  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().from("organizations").insert({ name, sport, created_by: userId });
    if (error) return setErr(error.message);
    router.refresh();
  }
  return (
    <form className="form" onSubmit={create}>
      <div><label className="lbl" htmlFor="oname">Team or program name</label><input id="oname" required value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><label className="lbl" htmlFor="osport">Sport</label><select id="osport" value={sport} onChange={(e) => setSport(e.target.value)}>{SPORTS.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div><button className="btn primary" type="submit">Create team</button></div>
      {err && <p className="err full">{err}</p>}
    </form>
  );
}
