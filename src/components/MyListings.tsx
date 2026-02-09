"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

type MyListingRow = {
  id: string;
  title: string;
  price: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
};

export function MyListings() {
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<MyListingRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("id,title,price,city,state,zip,created_at")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErr(error.message);
        setRows([]);
      } else {
        setRows((data as any) ?? []);
      }

      setLoading(false);
    })();
  }, [supabase]);

  const hasListings = useMemo(() => rows.length > 0, [rows]);

  if (loading) return <div className="text-white/75">Loading…</div>;
  if (err) return <div className="text-red-400">Error: {err}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Listings</h1>
          <p className="text-white/70">Only listings you created show up here.</p>
        </div>
        <Link href="/create">
          <Button>Create listing</Button>
        </Link>
      </div>

      {!hasListings ? (
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6 text-white/80">
          You don’t have any listings yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold">{r.title}</div>
                  <div className="text-sm text-white/70">
                    {r.city ? `${r.city}, ` : ""}
                    {r.state ?? ""} {r.zip ?? ""}
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-[#D4AF37]">
                  {typeof r.price === "number" ? `$${r.price.toLocaleString()}` : ""}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link href={`/listing/${r.id}`}>
                  <Button variant="secondary">View</Button>
                </Link>
                <Link href={`/listing/${r.id}/edit`}>
                  <Button>Edit</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {userId ? (
        <div className="text-xs text-white/50">
          Signed in as: {userId}
        </div>
      ) : null}
    </div>
  );
}
