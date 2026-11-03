"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { canSetStage, STAGES } from "@/lib/scouting";

const NEXT = ["Evaluate", "Invite to tryout", "Send offer", "Mark signed"];

export default function TeamBoard({ orgId, role, entries, names }: { orgId: string; role: string; entries: { athlete_id: string; stage: number }[]; names: Record<string, string> }) {
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
  return (
    <>
      <h3>Big board</h3>
      <p className="lead">Moving a player to Tryout invite or Offer sent shows it in their athlete account.</p>
      {err && <p className="err">{err}</p>}
      <div className="boardwrap"><div className="board">
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
