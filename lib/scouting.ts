// Scouting model: metric definitions, peer benchmarks, play-style schemes and report generation.
// Benchmarks are starting estimates for the position across college/pro-development levels.
// Replace them with real peer distributions as athlete data accumulates.

export const SPORTS = ["Football", "Basketball", "Soccer", "Baseball"] as const;
export type Sport = (typeof SPORTS)[number];

export type MetricDef = {
  key: string;
  label: string;
  unit: string;
  mean: number;
  sd: number;
  lowerIsBetter?: boolean;
  strength: string;
  weakness: string;
};

export type Scheme = { name: string; description: string; weights: Record<string, number> };

export type SportModel = {
  position: string;
  seasonColumns: string[];
  metrics: MetricDef[];
  schemes: Scheme[];
};

export const MODELS: Record<Sport, SportModel> = {
  Football: {
    position: "Wide receiver",
    seasonColumns: ["G", "Rec", "Yds", "TD", "YAC/rec"],
    metrics: [
      { key: "deep", label: "Deep catch rate (20+ yds)", unit: "%", mean: 38, sd: 8, strength: "Wins deep and tracks the ball over the shoulder.", weakness: "Struggles to finish deep targets." },
      { key: "yprr", label: "Yards per route run", unit: "", mean: 1.7, sd: 0.45, strength: "Produces on every route, not just on volume.", weakness: "Low production per route run." },
      { key: "yac", label: "Yards after catch / rec", unit: "", mean: 4.8, sd: 1.2, strength: "Turns short catches into chunk plays.", weakness: "Goes down on first contact after the catch." },
      { key: "sep", label: "Separation at target", unit: " yd", mean: 2.6, sd: 0.55, strength: "Gets open with route speed and sharp breaks.", weakness: "Struggles to separate from tight coverage." },
      { key: "catch", label: "Catch rate", unit: "%", mean: 65, sd: 7, strength: "Reliable on catchable balls.", weakness: "Catch rate below the position average." },
      { key: "cont", label: "Contested catch rate", unit: "%", mean: 45, sd: 9, strength: "Wins 50/50 balls against physical corners.", weakness: "Loses contested catches. Work on hand strength and body position." },
      { key: "block", label: "Run-blocking grade", unit: "", mean: 65, sd: 9, strength: "Willing, effective blocker in the run game.", weakness: "Inconsistent blocker. Run-heavy teams will notice." },
      { key: "drop", label: "Drop rate", unit: "%", mean: 6, sd: 2, lowerIsBetter: true, strength: "Sure hands. Rarely drops a catchable ball.", weakness: "Drops on quick throws. Scouts will ask about it." },
    ],
    schemes: [
      { name: "Vertical / play-action", description: "Outside X receiver on go, post and deep-cross routes off play-action.", weights: { deep: 3, yprr: 2, sep: 2, cont: 1 } },
      { name: "Air Raid / spread", description: "Moves between slot and outside on a choice-route tree in 4-wide sets.", weights: { sep: 3, yprr: 2, catch: 2, yac: 1 } },
      { name: "West Coast timing", description: "Short, quick timing throws that depend on sure hands and YAC.", weights: { catch: 3, drop: 3, yac: 2, sep: 1 } },
      { name: "Run-first / RPO", description: "Blocks most snaps and wins on RPO glance and bubble routes.", weights: { block: 3, yac: 2, cont: 2 } },
    ],
  },
  Basketball: {
    position: "Point guard",
    seasonColumns: ["G", "MIN", "PTS", "AST", "REB", "3P%"],
    metrics: [
      { key: "trans", label: "Transition pts / possession", unit: "", mean: 1.05, sd: 0.12, strength: "Pushes the pace and finishes or finds the open man on the break.", weakness: "Slows the game down in transition." },
      { key: "cs", label: "Catch-and-shoot 3P%", unit: "%", mean: 35, sd: 4.5, strength: "Knock-down shooter off the catch.", weakness: "Defenders can sag off; the jumper isn't a threat yet." },
      { key: "pnr", label: "Pick-and-roll pts / possession", unit: "", mean: 0.85, sd: 0.12, strength: "Reads the screen well and hits the roller or the pull-up.", weakness: "Pick-and-roll reads need work." },
      { key: "ast", label: "Assist-to-turnover", unit: "", mean: 1.9, sd: 0.6, strength: "Protects the ball while creating.", weakness: "Turnover-prone for a lead guard." },
      { key: "def", label: "On-ball defense (opp FG%)", unit: "%", mean: 43, sd: 4, lowerIsBetter: true, strength: "Locks up ball handlers at the point of attack.", weakness: "Beaten off the dribble. Needs lateral quickness work." },
      { key: "ftr", label: "Free-throw rate", unit: "", mean: 0.28, sd: 0.07, strength: "Attacks the rim and lives at the line.", weakness: "Settles for jumpers instead of drawing fouls." },
      { key: "reb", label: "Rebound rate", unit: "%", mean: 8, sd: 2, strength: "Rebounds well above guard average.", weakness: "Rarely crashes the glass." },
    ],
    schemes: [
      { name: "Pick-and-roll heavy", description: "Lead ball handler running high screens most possessions.", weights: { pnr: 3, ast: 2, cs: 1, ftr: 1 } },
      { name: "Up-tempo transition", description: "Push after every rebound for early threes and drive-and-kick.", weights: { trans: 3, ast: 2, cs: 1, reb: 1 } },
      { name: "Motion / 5-out", description: "Off-ball shooter and second handler in a ball-movement system.", weights: { cs: 3, ast: 2, pnr: 1 } },
      { name: "Defense-first / switching", description: "Switch every screen and guard several positions.", weights: { def: 3, reb: 2, ftr: 1 } },
    ],
  },
  Soccer: {
    position: "Winger",
    seasonColumns: ["Apps", "Min", "G", "A", "xG"],
    metrics: [
      { key: "drib", label: "Dribbles completed / 90", unit: "", mean: 1.8, sd: 0.9, strength: "Beats defenders one-on-one.", weakness: "Rarely beats a defender off the dribble." },
      { key: "carry", label: "Progressive carries / 90", unit: "", mean: 3.5, sd: 1.4, strength: "Moves the ball up the pitch without help.", weakness: "Doesn't carry the ball forward." },
      { key: "xa", label: "Expected assists / 90", unit: "", mean: 0.15, sd: 0.07, strength: "Creates quality chances for teammates.", weakness: "Chance creation is below the position average." },
      { key: "fin", label: "Goals minus xG", unit: "", mean: 0, sd: 2, strength: "Finishes above expectation.", weakness: "Finishing below expectation." },
      { key: "pass", label: "Pass completion", unit: "%", mean: 78, sd: 6, strength: "Secure in possession.", weakness: "Forces risky passes. Possession teams want more security." },
      { key: "def", label: "Defensive actions / 90", unit: "", mean: 5, sd: 2, strength: "Works hard tracking back and pressing.", weakness: "Low defensive work rate." },
      { key: "air", label: "Aerial duels won", unit: "%", mean: 42, sd: 10, strength: "Strong in the air.", weakness: "Weak in the air on set pieces and long balls." },
    ],
    schemes: [
      { name: "Counter-attack", description: "Stay high and attack space after turnovers.", weights: { carry: 3, drib: 2, fin: 2, xa: 1 } },
      { name: "Direct / crossing", description: "Hold the width, beat the fullback and deliver crosses.", weights: { xa: 3, drib: 2, air: 1 } },
      { name: "Possession", description: "Inverted winger keeping the ball in tight spaces.", weights: { pass: 3, drib: 2, xa: 2 } },
      { name: "High press", description: "Lead the press from the wing and win the ball high.", weights: { def: 3, carry: 1, fin: 1 } },
    ],
  },
  Baseball: {
    position: "Pitcher",
    seasonColumns: ["G", "IP", "ERA", "K", "BB", "WHIP"],
    metrics: [
      { key: "whiff", label: "Breaking-ball whiff rate", unit: "%", mean: 30, sd: 6, strength: "Has a true put-away pitch.", weakness: "Breaking ball doesn't miss bats." },
      { key: "k9", label: "Strikeouts / 9", unit: "", mean: 8.5, sd: 2, strength: "Misses bats at a high rate.", weakness: "Pitches to contact more than scouts like." },
      { key: "spin", label: "Fastball spin", unit: " rpm", mean: 2250, sd: 160, strength: "Fastball rides through the top of the zone.", weakness: "Low-spin fastball is easier to square up." },
      { key: "velo", label: "Fastball velocity", unit: " mph", mean: 91, sd: 2.4, strength: "Above-average velocity.", weakness: "Velocity below what most pro teams look for." },
      { key: "stam", label: "Pitches per start", unit: "", mean: 80, sd: 12, strength: "Holds stuff deep into games.", weakness: "Limited stamina for a starter." },
      { key: "gb", label: "Groundball rate", unit: "%", mean: 43, sd: 6, strength: "Keeps the ball on the ground.", weakness: "Fly-ball pitcher. Risky in hitter-friendly parks." },
      { key: "bb9", label: "Walks / 9", unit: "", mean: 3.5, sd: 1.1, lowerIsBetter: true, strength: "Commands the zone.", weakness: "Command is the biggest question." },
    ],
    schemes: [
      { name: "High-leverage reliever", description: "One inning, max effort, late in games.", weights: { whiff: 3, k9: 3, velo: 2, spin: 1 } },
      { name: "Multi-inning reliever", description: "Two to three innings out of the bullpen.", weights: { k9: 2, stam: 2, bb9: 2, whiff: 1 } },
      { name: "Starting pitcher", description: "Face the lineup 2–3 times with a deeper pitch mix.", weights: { stam: 3, bb9: 3, gb: 1, k9: 1 } },
      { name: "Groundball specialist", description: "Come in with runners on to get double plays.", weights: { gb: 3, bb9: 2 } },
    ],
  },
};

// Standard normal CDF (Abramowitz–Stegun approximation)
function normCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function percentile(def: MetricDef, value: number): number {
  const z = (value - def.mean) / def.sd;
  const p = normCdf(def.lowerIsBetter ? -z : z) * 100;
  return Math.max(1, Math.min(99, Math.round(p)));
}

export type ScoredMetric = MetricDef & { value: number; pct: number };

export function scoreMetrics(sport: Sport, values: Record<string, number | null | undefined>): ScoredMetric[] {
  return MODELS[sport].metrics
    .filter((m) => typeof values[m.key] === "number" && !Number.isNaN(values[m.key]))
    .map((m) => ({ ...m, value: values[m.key] as number, pct: percentile(m, values[m.key] as number) }));
}

export function fit(scheme: Scheme, pcts: Record<string, number>): number | null {
  let t = 0, w = 0;
  for (const [k, wt] of Object.entries(scheme.weights)) {
    if (typeof pcts[k] !== "number") continue;
    t += pcts[k] * wt;
    w += wt;
  }
  return w === 0 ? null : Math.round(t / w);
}

export type Report = {
  metrics: ScoredMetric[];
  fits: (Scheme & { fit: number })[];
  strengths: ScoredMetric[];
  weaknesses: ScoredMetric[];
  summary: string;
};

export function buildReport(sport: Sport, values: Record<string, number | null | undefined>): Report {
  const metrics = scoreMetrics(sport, values);
  const pcts = Object.fromEntries(metrics.map((m) => [m.key, m.pct]));
  const fits = MODELS[sport].schemes
    .map((s) => ({ ...s, fit: fit(s, pcts) }))
    .filter((s): s is Scheme & { fit: number } => s.fit !== null)
    .sort((a, b) => b.fit - a.fit);
  const strengths = metrics.filter((m) => m.pct >= 70).sort((a, b) => b.pct - a.pct);
  const weaknesses = metrics.filter((m) => m.pct <= 40).sort((a, b) => a.pct - b.pct);
  let summary = "Add game metrics to generate a scouting report.";
  if (fits.length) {
    const b = fits[0];
    summary = `Best used in a ${b.name} system (${b.fit}% fit).`;
    if (strengths.length) summary += ` Biggest strength: ${strengths[0].label.toLowerCase()}.`;
    if (weaknesses.length) summary += ` Main thing to improve: ${weaknesses[0].label.toLowerCase()}.`;
  }
  return { metrics, fits, strengths, weaknesses, summary };
}

export const band = (p: number) => (p >= 70 ? "good" : p <= 40 ? "bad" : "mid");

export const STAGES = ["Watching", "Evaluating", "Tryout invite", "Offer sent", "Signed"];
export const STAFF_ROLES: Record<string, string> = { gm: "General manager", hc: "Head coach", pc: "Position coach", scout: "Scout" };

export function canSetStage(role: string | null, stage: number) {
  if (!role) return false;
  if (stage <= 1) return true;
  if (stage === 2) return role === "gm" || role === "hc";
  return role === "gm";
}

export const money = (cents: number) => "$" + Math.round(cents / 100).toLocaleString("en-US");
