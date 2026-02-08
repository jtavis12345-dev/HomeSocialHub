"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";

export function LoginForm() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password: pw });
        if (error) throw error;
        setMsg("Signup successful. Check email if confirmation is enabled, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (e: any) {
      setMsg(e.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/85">Email</div>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/85">Password</div>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
      </div>

      {msg ? <div className="rounded-lg bg-[#0f0f0f]/5 p-3 text-sm text-white/85">{msg}</div> : null}

      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={busy || !email || pw.length < 6}>
          {busy ? "Working…" : (mode === "signup" ? "Create account" : "Sign in")}
        </Button>
        <Button variant="secondary" type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Need an account?" : "Have an account?"}
        </Button>
      </div>

      <div className="text-xs text-white/55">
        MVP note: password must be at least 6 characters (Supabase default).
      </div>
    </Card>
  );
}
