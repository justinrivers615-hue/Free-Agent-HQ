"use client";
import { useState } from "react";

export default function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [on, setOn] = useState(tabs[0].id);
  return (
    <section className="card">
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} className="tab" role="tab" type="button" aria-selected={on === t.id} onClick={() => setOn(t.id)}>{t.label}</button>
        ))}
      </div>
      {tabs.map((t) => <div key={t.id} className="panel" role="tabpanel" hidden={on !== t.id}>{t.content}</div>)}
    </section>
  );
}
