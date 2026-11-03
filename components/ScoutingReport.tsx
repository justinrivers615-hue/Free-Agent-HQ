import { band, type Report } from "@/lib/scouting";

export default function ScoutingReport({ report }: { report: Report }) {
  if (!report.metrics.length) return <p className="summary">{report.summary}</p>;
  return (
    <>
      <p className="summary">{report.summary}</p>
      <p className="sub">What they bring, by play style</p>
      <div>
        {report.fits.map((s, i) => (
          <div className="fit" key={s.name}>
            <div><h5>{s.name}{i === 0 && <span className="best">Best fit</span>}</h5><p>{s.description}</p></div>
            <div className="track"><div className={`fill${i === 0 ? " self" : ""}`} style={{ width: `${s.fit}%` }} /></div>
            <span className="pct">{s.fit}%</span>
          </div>
        ))}
      </div>
      <p className="sub">Strengths &amp; weaknesses</p>
      <div className="two">
        <div className="sw good"><h5>Strengths</h5>{report.strengths.length ? report.strengths.map((m) => <div key={m.key}><b>{m.label} · {m.value}{m.unit}</b>{m.strength}</div>) : <p className="note">None above the 70th percentile yet.</p>}</div>
        <div className="sw bad"><h5>Weaknesses</h5>{report.weaknesses.length ? report.weaknesses.map((m) => <div key={m.key}><b>{m.label} · {m.value}{m.unit}</b>{m.weakness}</div>) : <p className="note">Nothing below the 40th percentile.</p>}</div>
      </div>
      <p className="sub">Game metrics vs. position</p>
      <div className="metrics">
        {report.metrics.map((m) => (
          <div className="metric" key={m.key}>
            <span>{m.label}</span><span className="v">{m.value}{m.unit}</span>
            <div className="track"><div className={`fill ${band(m.pct)}`} style={{ width: `${m.pct}%` }} /></div>
            <small>Percentile {m.pct}</small>
          </div>
        ))}
      </div>
      <p className="note">Percentiles compare each number with typical players at this position. Numbers are self-reported until verified.</p>
    </>
  );
}
