"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STAFF_ROLES } from "@/lib/scouting";

export default function StaffPanel({ orgId, userId, isGm, members, invites, seatsLeft }: {
  orgId: string; userId: string; isGm: boolean; seatsLeft: number;
  members: { id: string; name: string; role: string }[]; invites: { id: string; email: string; staff_role: string }[];
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("scout");
  const [msg, setMsg] = useState("");
  const router = useRouter();
  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().from("org_invites").insert({ org_id: orgId, email: email.trim().toLowerCase(), staff_role: role, invited_by: userId });
    setMsg(error ? (error.code === "23505" ? "That email already has an invite." : error.message) : `Invite saved. Ask them to sign up as Coach / GM with ${email}.`);
    if (!error) { setEmail(""); router.refresh(); }
  }
  async function cancel(id: string) {
    await createClient().from("org_invites").delete().eq("id", id);
    router.refresh();
  }
  return (
    <>
      <h3>Staff</h3>
      <div className="staff">
        {members.map((m) => <div key={m.id}><span><b>{m.name}</b> <small className="note">· {STAFF_ROLES[m.role]}</small></span><span className="status">Active</span></div>)}
        {invites.map((i) => <div key={i.id}><span><b>{i.email}</b> <small className="note">· {STAFF_ROLES[i.staff_role]}</small></span><span><span className="status pend">Invite pending</span>{isGm && <> <button className="link" type="button" onClick={() => cancel(i.id)}>Cancel</button></>}</span></div>)}
      </div>
      {isGm ? (
        <form className="form" onSubmit={invite}>
          <div><label className="lbl" htmlFor="iemail">Invite by email</label><input id="iemail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="lbl" htmlFor="irole">Role</label><select id="irole" value={role} onChange={(e) => setRole(e.target.value)}>{Object.entries(STAFF_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><button className="btn primary" type="submit" disabled={seatsLeft <= 0}>Add staff</button></div>
          <p className="note full">{msg || `${seatsLeft} seats left.`}</p>
        </form>
      ) : <p className="note">Only the general manager can add or remove staff.</p>}
    </>
  );
}
