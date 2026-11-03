"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar({ role }: { role: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const links = role === "team" ? [["/team", "Team center"]] : role === "brand" ? [["/nil", "NIL deals"]] : role === "athlete" ? [["/athlete", "My career"], ["/nil", "NIL"]] : [];
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <header className="bar">
      <div className="wrap">
        <Link href="/" className="logo">Free Agent <span>HQ</span></Link>
        <nav className="nav" aria-label="Main">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={path.startsWith(href) ? "on" : ""}>{label}</Link>
          ))}
          {role ? <button type="button" onClick={signOut}>Sign out</button> : <Link href="/login">Sign in</Link>}
        </nav>
      </div>
    </header>
  );
}
