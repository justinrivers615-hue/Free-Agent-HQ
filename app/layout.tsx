import type { Metadata } from "next";
import "./globals.css";
import { getSessionProfile } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Free Agent HQ",
  description: "Run your own career. Tryouts, scouting reports, brand and NIL deals, without an agent.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSessionProfile();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap"
        />
      </head>
      <body>
        <NavBar role={profile?.role ?? null} />
        {children}
      </body>
    </html>
  );
}
