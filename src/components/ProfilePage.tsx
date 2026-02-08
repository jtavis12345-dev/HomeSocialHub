"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";

type Role = "buyer" | "seller" | "pro";

export function ProfilePage() {
  const supabase = supabaseBrowser();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [role, setRole] = useState<Role>("buyer");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [serviceArea, setServiceArea] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { window.location.href = "/login"; return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setRole((data.role as Role) ?? "buyer");
        setName(data.full_name ?? "");
        setBio(data.bio ?? "");
        setServiceArea(data.service_area ?? "");
      }
    })();
  }, []);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { window.location.href = "/login"; return; }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: name || null,
        role,
        bio: bio || null,
        service_area: serviceArea || null
      });
      if (error) throw error;
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e.message ?? "Error saving");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/85">Display name</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Seller" />
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/85">Role</div>
        <select value={role} onChange={(e)=>setRole(e.target.value as Role)}
          className="w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200">
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="pro">Pro (contractor/title/etc.)</option>
        </select>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/85">Service area (for Pros)</div>
        <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Austin TX / 25mi radius" />
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/85">Bio</div>
        <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What should people know about you?" />
      </div>

      {msg ? <div className="rounded-lg bg-[#0f0f0f]/5 p-3 text-sm text-white/85">{msg}</div> : null}

      <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
    </Card>
  );
}
