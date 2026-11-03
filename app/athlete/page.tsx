import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { buildReport, MODELS, STAGES, type Sport } from "@/lib/scouting";
import AthleteProfileForm from "@/components/AthleteProfileForm";
import MetricsEditor from "@/components/MetricsEditor";
import SeasonsEditor from "@/components/SeasonsEditor";
import ScoutingReport from "@/components/ScoutingReport";
import Tabs from "@/components/Tabs";
import DealPricer from "@/components/DealPricer";

export const dynamic = "force-dynamic";

export default async function AthletePage() {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");
  if (profile.role !== "athlete") redirect("/home");

  const { data: athlete } = await supabase.from("athletes").select("*").eq("id", user.id).maybeSingle();

  if (!athlete) {
    return (
      <main className="wrap view">
        <section className="intro"><h1>Set up your athlete profile</h1><p>Teams search these details. You can change everything except your sport later.</p></section>
        <section className="card panel"><AthleteProfileForm userId={user.id} initial={null} /></section>
      </main>
    );
  }

  const sport = athlete.sport as Sport;
  const [{ data: seasons }, { data: metrics }, { data: invites }, { data: opps }] = await Promise.all([
    supabase.from("athlete_seasons").select("id, season, stats").eq("athlete_id", user.id).order("season"),
    supabase.from("athlete_metrics").select("key, value, percentile").eq("athlete_id", user.id),
    supabase.from("board_entries").select("stage, updated_at, organizations(name)").eq("athlete_id", user.id).gte("stage", 2),
    supabase.from("opportunities").select("*").eq("sport", sport).order("starts_on", { ascending: true }).limit(50),
  ]);
  const values = Object.fromEntries((metrics ?? []).map((m) => [m.key, Number(m.value)]));
  const report = buildReport(sport, values);
  const initials = (profile.full_name || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2);

  return (
    <main className="wrap view">
      <section className="intro">
        <h1>{profile.full_name || "My career"}</h1>
        <p>Your scouting report updates as you add game numbers. Teams on Free Agent HQ see this report when they search for players.</p>
      </section>
      <div className="grid">
        <aside className="card side">
          <div className="jersey"><div className="num">{initials}</div><div><h2>{profile.full_name}</h2><p>{[athlete.position, athlete.level, athlete.sport].filter(Boolean).join(" · ")}</p></div></div>
          <dl className="note" style={{ display: "grid", gap: 6, margin: 0 }}>
            <div>{athlete.height} {athlete.weight}</div><div>{athlete.school}</div><div>{athlete.followers.toLocaleString("en-US")} followers · {athlete.engagement}% engagement</div>
          </dl>
          {(invites ?? []).map((iv, i) => {
            const org = iv.organizations as unknown as { name: string } | null;
            return <div key={i} className="opp invite" style={{ gridTemplateColumns: "1fr" }}><div><h4>{STAGES[iv.stage]}</h4><div className="d">from {org?.name ?? "a team"}</div></div></div>;
          })}
        </aside>
        <Tabs tabs={[
          { id: "report", label: "Scouting report", content: <><h3>Scouting report</h3><p className="sub">Stat production</p><SeasonsEditor userId={user.id} columns={MODELS[sport].seasonColumns} seasons={seasons ?? []} editable /><ScoutingReport report={report} /></> },
          { id: "metrics", label: "Game metrics", content: <><h3>Game metrics</h3><p className="lead">Enter your numbers from last season ({MODELS[sport].position} model). Leave a box empty if you don't track it. Each one is compared with the typical player at your position.</p><MetricsEditor userId={user.id} sport={sport} initial={Object.fromEntries((metrics ?? []).map((m) => [m.key, m.value]))} /></> },
          { id: "opps", label: "Tryouts", content: <><h3>Tryouts &amp; showcases</h3>{(opps ?? []).length ? <div className="list">{opps!.map((o) => (
            <article className="opp" key={o.id}><div className="match">{o.starts_on ? new Date(o.starts_on).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Open"}<small>{o.kind}</small></div>
              <div><h4>{o.title}</h4><div className="d">{o.description}</div><div className="tags"><span className="tag">{o.location || "Location TBA"}</span><span className="tag fee">{o.fee_cents ? `$${o.fee_cents / 100} fee` : "Free"}</span></div></div></article>
          ))}</div> : <p className="note">No {sport.toLowerCase()} tryouts posted yet. Teams post them from their Team center, and they will show up here.</p>}</> },
          { id: "price", label: "Price a deal", content: <DealPricer followers={athlete.followers} engagement={Number(athlete.engagement)} /> },
          { id: "profile", label: "Profile", content: <><h3>Profile</h3><AthleteProfileForm userId={user.id} initial={{ ...athlete, engagement: Number(athlete.engagement) }} /></> },
        ]} />
      </div>
    </main>
  );
}
