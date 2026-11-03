"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { canSetStage, STAGES } from "@/lib/scouting";

const NEXT = ["Evaluate", "Invite to tryout", "Send offer", "Mark signed"];

export type ScoutItem = { prospect_id: string; name: string; detail: string; athlete_id: string | null };

export default function TeamBoard({ orgId, role, entries, names, scouts }: { orgId: string; role: string; entries: { athlete_id: string; stage: number }[]; names: Record<string, string>; scouts: ScoutItem[] }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  async function move(id: string, stage: number) {
    const { error } = await createClient().from("board_entries").update({ stage, updated_at: new Date().toISOString() }).eq("org_id", orgId).eq("athlete_id", id);
    setErr(error ? "You don't have permission for that step." : "");
    router.refresh();
  }
  async function remove(id: string) {
    await createClient().from("board_entries").delete().eq("org_id", orgId).eq("athlete_id", id);
    router.refresh();
  }
  async function promote(s: ScoutItem) {
    if (!s.athlete_id) return;
    const sb = createClient();
    const { error } = await sb.from("board_entries").insert({ org_id: orgId, athlete_id: s.athlete_id, stage: 0 });
    if (error && error.code !== "23505") return setErr(error.message);
    await sb.from("scout_list").delete().eq("org_id", orgId).eq("prospect_id", s.prospect_id);
    router.refresh();
  }
  async function unscout(id: string) {
    await createClient().from("scout_list").delete().eq("org_id", orgId).eq("prospect_id", id);
    router.refresh();
  }
  return (
    <>
      <h3>Big board</h3>
      <p className="lead">The Scouts list holds prospects who haven&apos;t joined yet. Once a player is on Free Agent HQ, move them to Watching. Moving a player to Tryout invite or Offer sent shows it in their athlete account.</p>
      {err && <p className="err">{err}</p>}
      <div className="boardwrap"><div className="board" style={{ gridTemplateColumns: "repeat(6, minmax(170px, 1fr))", minWidth: 1060 }}>
        <div className="col" style={{ borderStyle: "dashed" }}>
          <h5>Scouts list<span>{scouts.length}</span></h5>
          {scouts.map((s) => (
            <div className="kc" key={s.prospect_id}>
              <b>{s.name}</b><span>{s.detail}</span>
              {s.athlete_id ? <button className="btn sm primary" type="button" onClick={() => promote(s)}>Move to Watching</button> : <small>Not on Free Agent HQ yet</small>}
              <button className="link" type="button" onClick={() => unscout(s.prospect_id)}>Remove</button>
            </div>
          ))}
          {!scouts.length && <p className="note">Add prospects from the Prospects tab.</p>}
        </div>
        {STAGES.map((st, i) => {
          const items = entries.filter((e) => e.stage === i);
          return (
            <div className="col" key={st}>
              <h5>{st}<span>{items.length}</span></h5>
              {items.map((e) => {
                const ok = canSetStage(role, i + 1);
                return (
                  <div className="kc" key={e.athlete_id}>
                    <b>{names[e.athlete_id] ?? "Athlete"}</b>
                    {i < 4 ? <><button className={`btn sm${ok ? " primary" : ""}`} type="button" disabled={!ok} onClick={() => move(e.athlete_id, i + 1)}>{NEXT[i]}</button>{!ok && <small>{i + 1 >= 3 ? "GM only" : "GM or head coach"}</small>}</> : <small>Signed</small>}
                    <button className="link" type="button" onClick={() => remove(e.athlete_id)}>Remove</button>
                  </div>
                );
              })}
              {!items.length && <p className="note">Empty</p>}
            </div>
          );
        })}
      </div></div>
    </>
  );
}
