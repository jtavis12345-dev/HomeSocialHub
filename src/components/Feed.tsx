"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Listing, Media } from "@/lib/types";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { formatMoney } from "@/lib/utils";
import { publicUrl } from "@/lib/media";

type ListingWithMedia = Listing & { media: Media[] };

export function Feed() {
  const supabase = supabaseBrowser();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ListingWithMedia[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("listings")
        .select("*, media(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) console.error(error);
      setRows((data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      (r.title || "").toLowerCase().includes(s) ||
      (r.city || "").toLowerCase().includes(s) ||
      (r.state || "").toLowerCase().includes(s) ||
      (r.zip || "").toLowerCase().includes(s)
    );
  }, [q, rows]);

  if (loading) return <div className="text-white/75">Loading listings…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, city, state, zip…" />
        <Link className="shrink-0" href="/create"><Button>Create listing</Button></Link>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-white/85">No active listings yet.</div>
          <div className="mt-2 text-sm text-white/75">Create one using “Create listing”.</div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const heroVideo = l.media?.find(m => m.type === "video");
            const heroPhoto = l.media?.find(m => m.type === "photo");
            const hero = heroVideo ? publicUrl(heroVideo.storage_bucket, heroVideo.storage_path)
                      : heroPhoto ? publicUrl(heroPhoto.storage_bucket, heroPhoto.storage_path)
                      : null;

            return (
              <Link key={l.id} href={`/listing/${l.id}`} className="group">
                <Card className="overflow-hidden p-0">
                  <div className="aspect-video w-full bg-[#141414]">
                    {hero ? (
                      heroVideo ? (
                        <video className="h-full w-full object-cover" src={hero} muted playsInline preload="metadata" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="h-full w-full object-cover" src={hero} alt="" />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-white/55">No media</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-white group-hover:underline">{l.title}</div>
                      <div className="text-right font-extrabold">{formatMoney(l.price)}</div>
                    </div>
                    <div className="mt-1 text-sm text-white/75">
                      {l.beds} bd • {l.baths} ba {l.sqft ? `• ${l.sqft.toLocaleString()} sqft` : ""}
                    </div>
                    <div className="mt-1 text-sm text-white/75">
                      {l.city}, {l.state} {l.zip}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
