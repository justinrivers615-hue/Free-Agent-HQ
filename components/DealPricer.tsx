"use client";
import { useState } from "react";

export default function DealPricer({ followers, engagement }: { followers: number; engagement: number }) {
  const [f, setF] = useState(followers);
  const [e, setE] = useState(engagement || 3);
  const [mkt, setMkt] = useState(1.3);
  const [type, setType] = useState(1);
  const mid = (f / 1000) * 12 * (e / 3) * mkt * type;
  const $ = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
  return (
    <>
      <h3>What should I charge?</h3>
      <p className="lead">A starting price for one deliverable, based on audience size, engagement and reach. Use it to anchor your negotiation.</p>
      <div className="form">
        <div><label className="lbl" htmlFor="pf">Followers</label><input id="pf" type="number" min={0} value={f} onChange={(x) => setF(Number(x.target.value))} /></div>
        <div><label className="lbl" htmlFor="pe">Engagement %</label><input id="pe" type="number" min={0} step="0.1" value={e} onChange={(x) => setE(Number(x.target.value))} /></div>
        <div><label className="lbl" htmlFor="pm">Audience</label><select id="pm" value={mkt} onChange={(x) => setMkt(Number(x.target.value))}><option value={1}>Mostly local</option><option value={1.3}>Regional</option><option value={1.6}>National</option></select></div>
        <div><label className="lbl" htmlFor="pt">Deliverable</label><select id="pt" value={type} onChange={(x) => setType(Number(x.target.value))}><option value={1}>Feed post</option><option value={0.6}>Story (3 frames)</option><option value={1.8}>Short video</option><option value={3}>Appearance (2 hrs)</option></select></div>
      </div>
      <div className="two">
        <div className="summary"><span className="note">Floor</span><div className="h3">{$(mid * 0.7)}</div></div>
        <div className="summary"><span className="note">Ask for</span><div className="h3">{$(mid)}</div></div>
        <div className="summary"><span className="note">Stretch</span><div className="h3">{$(mid * 1.4)}</div></div>
      </div>
      <p className="note">Estimate: followers ÷ 1,000 × $12 × (engagement ÷ 3%) × audience × deliverable. It will be replaced by real deal data as deals close on the platform.</p>
    </>
  );
}
