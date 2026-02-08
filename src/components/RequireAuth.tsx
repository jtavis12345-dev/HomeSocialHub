"use client";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const supabase = supabaseBrowser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else setReady(true);
    });
  }, []);

  if (!ready) return <div className="mx-auto max-w-2xl p-6 text-white/75">Checking session…</div>;
  return <>{children}</>;
}
