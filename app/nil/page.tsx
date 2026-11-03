import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import Tabs from "@/components/Tabs";
import NilMarket from "@/components/NilMarket";
import ComplianceCheck from "@/components/ComplianceCheck";
import Earnings from "@/components/Earnings";
import BrandDeals from "@/components/BrandDeals";

export const dynamic = "force-dynamic";

export default async function NilPage() {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");

  if (profile.role === "brand") {
    const { data: deals } = await supabase
      .from("nil_deals")
      .select("*, nil_applications(athlete_id, status, athletes(sport, position, level, followers, profiles(full_name)))")
      .eq("brand_user_id", user.id)
      .order("created_at", { ascending: false });
    return (
      <main className="wrap view">
        <section className="intro"><h1>{profile.full_name || "Your brand"}</h1><p>Post deals straight to athletes. No agent fees on either side. Accept the athletes you want and pay them directly.</p></section>
        <BrandDeals userId={user.id} brandName={profile.full_name} deals={deals ?? []} />
      </main>
    );
  }
  if (profile.role !== "athlete") redirect("/home");

  const { data: athlete } = await supabase.from("athletes").select("followers, division, sport").eq("id", user.id).maybeSingle();
  if (!athlete) redirect("/athlete");
  const [{ data: deals }, { data: apps }, { data: earnings }] = await Promise.all([
    supabase.from("nil_deals").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(100),
    supabase.from("nil_applications").select("deal_id, status").eq("athlete_id", user.id),
    supabase.from("earnings").select("*").eq("athlete_id", user.id).order("paid_on", { ascending: false }),
  ]);

  return (
    <main className="wrap view">
      <section className="intro"><h1>NIL, without the middleman</h1><p>Find deals, check whether a deal has to be reported before you sign, and track what you earn and owe in taxes.</p></section>
      <Tabs tabs={[
        { id: "market", label: "Marketplace", content: <NilMarket athleteId={user.id} followers={athlete.followers} sport={athlete.sport} deals={deals ?? []} applied={Object.fromEntries((apps ?? []).map((a) => [a.deal_id, a.status]))} /> },
        { id: "check", label: "Is this deal OK?", content: <ComplianceCheck division={athlete.division} /> },
        { id: "earn", label: "Earnings & taxes", content: <Earnings athleteId={user.id} rows={earnings ?? []} /> },
      ]} />
    </main>
  );
}
