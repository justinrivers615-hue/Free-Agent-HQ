"use client";
import { useState } from "react";

export default function ComplianceCheck({ division }: { division: string }) {
  const [div, setDiv] = useState(division === "pro" ? "other" : division);
  const [payer, setPayer] = useState("brand");
  const [amt, setAmt] = useState(1500);
  const [work, setWork] = useState(true);
  const $ = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  const out: [string, string, string][] = [];
  if (payer === "school") {
    out.push(div === "d1"
      ? ["okf", "School revenue share", "Paid directly by your school under the House settlement. It is not reported through NIL Go, but it counts toward the school's yearly cap. Get the amount, term and payment dates in writing."]
      : ["med", "Check your school's rules", "Direct school payments come from the House settlement and mainly apply to Division I schools that opted in. Ask compliance whether your school can pay you directly."]);
  } else {
    if (!work) out.push(["high", "No real work = likely rejected", "Pay without real deliverables looks like pay-for-play. Add specific work, like posts, appearances or signings, at a fair price."]);
    if (div === "d1" && amt >= 600) out.push(["high", "Report it through NIL Go", "Third-party deals of $600 or more go to the College Sports Commission through NIL Go. It checks for a real business purpose and pay in line with similar athletes. Roughly 1 in 5 submitted dollars has been rejected, so price it fairly."]);
    if (div === "d1" && amt < 600) out.push(["okf", "Under the NIL Go threshold", "Deals under $600 don't go through NIL Go, but still tell your compliance office."]);
    if (payer === "collective") out.push(["med", "Booster deals get extra review", "Collective and booster deals are checked for a real business purpose and pay inside the normal market range. Overpaying is the most common reason a deal is rejected."]);
    if (div !== "d1") out.push(["okf", "NIL Go doesn't apply", "Follow your school's disclosure rules, your association's rules and your state's NIL law."]);
  }
  out.push(["med", "Set aside money for taxes", `About ${$(amt * 0.28)} of this deal. NIL pay usually has no tax withheld.`]);
  return (
    <>
      <h3>Is this deal OK?</h3>
      <div className="form">
        <div><label className="lbl" htmlFor="cdiv">Your school</label><select id="cdiv" value={div} onChange={(e) => setDiv(e.target.value)}><option value="d1">Division I (in the settlement)</option><option value="ncaa">Other NCAA (D2 / D3)</option><option value="other">NAIA / JUCO / high school</option></select></div>
        <div><label className="lbl" htmlFor="cpay">Who is paying?</label><select id="cpay" value={payer} onChange={(e) => setPayer(e.target.value)}><option value="brand">A business or brand</option><option value="collective">A collective or booster</option><option value="school">My school (revenue share)</option></select></div>
        <div><label className="lbl" htmlFor="camt">Deal amount ($)</label><input id="camt" type="number" min={0} value={amt} onChange={(e) => setAmt(Number(e.target.value))} /></div>
        <label className="d" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" style={{ width: "auto" }} checked={work} onChange={(e) => setWork(e.target.checked)} /> I have real work to do</label>
      </div>
      <div className="list">{out.map(([s, t, m]) => <div key={t} className={`flag ${s}`}><span className="sev">{s === "high" ? "Must do" : s === "med" ? "Heads up" : "OK"}</span><p><b>{t}</b>{m}</p></div>)}</div>
      <p className="note">Summary of rules after the 2025 House v. NCAA settlement. Rules change and states add their own. Confirm with your compliance office before you sign. Not legal advice.</p>
    </>
  );
}
