"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ROLES = [
  ["athlete", "Athlete", "Manage my career"],
  ["team", "Coach / GM", "Find & sign players"],
  ["brand", "Brand", "Post NIL & sponsor deals"],
] as const;

export default function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [role, setRole] = useState("athlete");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg({});
    const supabase = createClient();
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setBusy(false);
      if (error) return setMsg({ err: error.message });
      if (!data.session) return setMsg({ ok: "Check your email and click the link to confirm your account." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ err: error.message === "Invalid login credentials" ? "That email and password don't match. Try again or create an account." : error.message });
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h1 className="h3">{mode === "signup" ? "Create your account" : "Sign in"}</h1>
      {mode === "signup" && (
        <>
          <div className="roles" role="radiogroup" aria-label="Account type">
            {ROLES.map(([v, l, d]) => (
              <label key={v}>
                <span><input type="radio" name="role" value={v} checked={role === v} onChange={() => setRole(v)} /> <b>{l}</b></span>
                <small className="d">{d}</small>
              </label>
            ))}
          </div>
          <div><label className="lbl" htmlFor="name">{role === "brand" ? "Business name" : "Full name"}</label><input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        </>
      )}
      <div><label className="lbl" htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label className="lbl" htmlFor="password">Password</label><input id="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {msg.err && <p className="err">{msg.err}</p>}
      {msg.ok && <p className="ok">{msg.ok}</p>}
      <button className="btn primary" disabled={busy} type="submit">{busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}</button>
      <button className="link" type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMsg({}); }}>
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </form>
  );
}
