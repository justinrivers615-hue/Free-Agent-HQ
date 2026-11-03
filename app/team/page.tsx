import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { STAFF_ROLES, type Sport } from "@/lib/scouting";
import Tabs from "@/components/Tabs";
import CreateOrg from "@/components/CreateOrg";
import TeamSearch, { type Prospect } from "@/components/TeamSearch";
import TeamBoard from "@/components/TeamBoard";
import StaffPanel from "@/components/StaffPanel";
import PostTryout from "@/components/PostTryout";
import ProspectsPanel, { type ProspectRow } from "@/components/ProspectsPanel";

export const dynamic = "force-dynamic";

const PERMS: [string, string, string[]][] = [
  ["view", "Search & read reports", ["gm", "hc", "pc", "scout"]],
  ["board", "Scouts list, import prospects, add to board", ["gm", "hc", "pc", "scout"]],
  ["invite", "Invite to tryout, post tryouts", ["gm", "hc"]],
  ["offer", "Send offers & sign", ["gm"]],
  ["staff", "Manage staff", ["gm"]],
];

export default async function TeamPage() {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");
  if (profile.role !== "team") redirect("/home");

  await supabase.rpc("accept_org_invites");
  const { data: membership } = await supabase.from("org_members").select("staff_role, organizations(*)").eq("user_id", user.id).limit(1).maybeSingle();

  if (!membership) {
    return (
      <main className="wrap view">
        <section className="intro"><h1>Set up your team</h1><p>Create your organization and you become its general manager. If your GM already invited you, sign up with that email address and you will join automatically.</p></section>
        <section className="card panel"><CreateOrg userId={user.id} /></section>
      </main>
    );
  }

  const org = membership.organizations as unknown as { id: string; name: string; sport: Sport; seat_limit: number };
  const role = membership.staff_role as string;

  const [{ data: athletes }, { data: board }, { data: members }, { data: invites }, { data: tryouts }, { data: prospectRows }, { data: scoutList }] = await Promise.all([
    supabase.from("athletes").select("id, position, level, school, height, weight, followers, profiles(full_name), athlete_metrics(key, value, percentile), athlete_seasons(season, stats)").eq("sport", org.sport).limit(500),
    supabase.from("board_entries").select("athlete_id, stage, notes").eq("org_id", org.id),
    supabase.from("org_members").select("user_id, staff_role, profiles(full_name)").eq("org_id", org.id),
    supabase.from("org_invites").select("id, email, staff_role").eq("org_id", org.id),
    supabase.from("opportunities").select("id, title, starts_on, location").eq("org_id", org.id).order("starts_on"),
    supabase.from("prospects").select("id, org_id, full_name, position, school, division, class_year, hometown, stats, source, athlete_id").eq("sport", org.sport).order("full_name").limit(5000),
    supabase.from("scout_list").select("prospect_id, prospects(full_name, position, school, class_year, athlete_id)").eq("org_id", org.id).order("added_at"),
  ]);
  const scouts = (scoutList ?? []).map((s) => {
    const p = s.prospects as unknown as { full_name: string; position: string; school: string; class_year: string; athlete_id: string | null } | null;
    return { prospect_id: s.prospect_id, name: p?.full_name ?? "Prospect", detail: [p?.position, p?.school, p?.class_year].filter(Boolean).join(" · "), athlete_id: p?.athlete_id ?? null };
  });

  const prospects: Prospect[] = (athletes ?? []).map((a) => {
    const p = a.profiles as unknown as { full_name: string } | null;
    const seasons = (a.athlete_seasons ?? []) as { season: string; stats: Record<string, string> }[];
    return {
      id: a.id, name: p?.full_name || "Unnamed athlete", position: a.position, level: a.level, school: a.school,
      size: [a.height, a.weight].filter(Boolean).join(" · "), followers: a.followers,
      latest: seasons.sort((x, y) => y.season.localeCompare(x.season))[0] ?? null,
      metrics: (a.athlete_metrics ?? []) as { key: string; value: string; percentile: number }[],
    };
  });
  const names = Object.fromEntries(prospects.map((p) => [p.id, `${p.name} · ${p.position || org.sport}`]));
  const seatsUsed = (members?.length ?? 0) + (invites?.length ?? 0);

  return (
    <main className="wrap view">
      <section className="intro"><h1>{org.name}</h1><p>Team center · {org.sport}. Search athletes by fit for your system, run them through your board, and manage staff.</p></section>
      <div className="grid">
        <aside className="card side">
          <div className="jersey"><div className="num" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>{org.name.slice(0, 2)}</div><div><h2>{profile.full_name}</h2><p>{STAFF_ROLES[role]} · {seatsUsed} of {org.seat_limit} seats</p></div></div>
          <div className="tbl"><table>
            <thead><tr><th scope="col">Can</th>{Object.keys(STAFF_ROLES).map((r) => <th scope="col" key={r} style={r === role ? { background: "var(--turf-soft)" } : undefined}>{r === "scout" ? "Scout" : r.toUpperCase()}</th>)}</tr></thead>
            <tbody>{PERMS.map(([k, l, rs]) => <tr key={k}><td style={{ whiteSpace: "normal" }}>{l}</td>{Object.keys(STAFF_ROLES).map((r) => <td key={r} style={{ textAlign: "center", ...(r === role ? { background: "var(--turf-soft)" } : {}) }}>{rs.includes(r) ? "Yes" : "–"}</td>)}</tr>)}</tbody>
          </table></div>
          <p className="note">Permissions are enforced by the database, not just the screen.</p>
        </aside>
        <Tabs tabs={[
          { id: "search", label: "Player search", content: <TeamSearch orgId={org.id} sport={org.sport} prospects={prospects} onBoard={(board ?? []).map((b) => b.athlete_id)} /> },
          { id: "board", label: `Big board (${(board?.length ?? 0) + scouts.length})`, content: <TeamBoard orgId={org.id} role={role} entries={board ?? []} names={names} scouts={scouts} /> },
          { id: "prospects", label: "Prospects", content: <ProspectsPanel orgId={org.id} sport={org.sport} userId={user.id} prospects={(prospectRows ?? []) as ProspectRow[]} onList={scouts.map((s) => s.prospect_id)} /> },
          { id: "tryouts", label: "Tryouts", content: <PostTryout orgId={org.id} sport={org.sport} userId={user.id} canPost={role === "gm" || role === "hc"} tryouts={tryouts ?? []} /> },
          { id: "staff", label: "Staff", content: <StaffPanel orgId={org.id} userId={user.id} isGm={role === "gm"} members={(members ?? []).map((m) => ({ id: m.user_id, name: (m.profiles as unknown as { full_name: string } | null)?.full_name || "Staff member", role: m.staff_role }))} invites={invites ?? []} seatsLeft={org.seat_limit - seatsUsed} /> },
        ]} />
      </div>
    </main>
  );
}
