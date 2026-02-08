"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { formatDate } from "@/lib/utils";

type Row = { thread_id: string; created_at: string; listing_id: string | null; title: string | null };

export function ThreadsList() {
  const supabase = supabaseBrowser();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { window.location.href = "/login"; return; }

      // Use a view-like join by querying thread_members then threads + listings
      const { data: tm, error: e1 } = await supabase
        .from("thread_members")
        .select("thread_id, threads(created_at, listing_id, listings(title))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (e1) console.error(e1);
      const mapped: Row[] = (tm as any[] ?? []).map(x => ({
        thread_id: x.thread_id,
        created_at: x.threads?.created_at,
        listing_id: x.threads?.listing_id ?? null,
        title: x.threads?.listings?.title ?? null
      }));
      setRows(mapped);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-white/75">Loading…</div>;

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <Card>
          <div className="text-white/85">No conversations yet.</div>
          <div className="mt-1 text-sm text-white/75">Open a listing and click “Message seller”.</div>
        </Card>
      ) : rows.map(r => (
        <Link key={r.thread_id} href={`/messages/${r.thread_id}`}>
          <Card className="hover:bg-[#0f0f0f]/5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{r.title ?? "Conversation"}</div>
              <div className="text-xs text-white/55">{formatDate(r.created_at)}</div>
            </div>
            <div className="mt-1 text-sm text-white/75">
              Thread: {r.thread_id.slice(0, 8)}…
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
