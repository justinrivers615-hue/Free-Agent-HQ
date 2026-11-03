import Link from "next/link";

export default function Landing() {
  return (
    <main className="wrap view">
      <section className="hero">
        <h1>Run your own career. Keep your own money.</h1>
        <p>Free Agent HQ gives athletes in every sport the tools an agent uses: AI scouting reports, tryout and pro opportunities, deal pricing, contract checks and NIL compliance. Athletes never pay a commission.</p>
        <div className="act"><Link className="btn primary" href="/login?mode=signup">Create your free account</Link><Link className="btn" href="/login">Sign in</Link></div>
      </section>
      <section className="cards3">
        <div className="card"><h3>Athletes</h3><p>Build a profile, get a scouting report that shows which play styles you fit, and find tryouts, showcases and pro leagues at home and overseas.</p></div>
        <div className="card"><h3>Coaches &amp; GMs</h3><p>Search athletes by fit for your system, move them from watch list to tryout to signed, and give every staff member the right permissions.</p></div>
        <div className="card"><h3>Brands &amp; NIL</h3><p>Post deals straight to athletes. College athletes check whether a deal must go through NIL Go before they sign.</p></div>
      </section>
    </main>
  );
}
