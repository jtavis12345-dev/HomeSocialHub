"use client";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Listing, Media } from "@/lib/types";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { formatMoney, formatDate } from "@/lib/utils";
import { publicUrl } from "@/lib/media";
import Link from "next/link";

type ListingWithMedia = Listing & { media: Media[] };

type CommentRow = {
  id: string;
  listing_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export function ListingDetail({ listingId }: { listingId: string }) {
  const supabase = supabaseBrowser();
  const [l, setL] = useState<ListingWithMedia | null>(null);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("listings")
        .select("*, media(*)")
        .eq("id", listingId)
        .single();
      if (error) console.error(error);
      setL((data as any) ?? null);

      const { data: c } = await supabase
        .from("comments")
        .select("id, listing_id, user_id, body, created_at, profiles(full_name)")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
        .limit(50);
      setComments((c as any) ?? []);
      setLoading(false);
    })();
  }, [listingId]);

  const heroVideo = useMemo(() => l?.media?.find(m => m.type === "video") ?? null, [l]);
  const photos = useMemo(() => (l?.media ?? []).filter(m => m.type === "photo").sort((a,b)=>a.sort_order-b.sort_order), [l]);
  const heroVideoUrl = heroVideo ? publicUrl(heroVideo.storage_bucket, heroVideo.storage_path) : null;

  async function postComment() {
    setMsg(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const body = newComment.trim();
      if (!body) return;

      const { error } = await supabase.from("comments").insert({
        listing_id: listingId,
        user_id: user.id,
        body
      });
      if (error) throw error;

      setNewComment("");
      const { data: c } = await supabase
        .from("comments")
        .select("id, listing_id, user_id, body, created_at, profiles(full_name)")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })
        .limit(50);
      setComments((c as any) ?? []);
    } catch (e: any) {
      setMsg(e.message ?? "Error posting comment");
    }
  }

  async function startMessageThread() {
    setMsg(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { window.location.href = "/login"; return; }
      if (!l) return;
      if (user.id === l.owner_id) { setMsg("You are the owner of this listing."); return; }

      // Create thread
      const { data: thread, error: e1 } = await supabase
        .from("threads")
        .insert({ listing_id: l.id })
        .select()
        .single();
      if (e1) throw e1;

      // Add members: buyer + seller
      const { error: e2 } = await supabase.from("thread_members").insert([
        { thread_id: thread.id, user_id: user.id },
        { thread_id: thread.id, user_id: l.owner_id }
      ]);
      if (e2) throw e2;

      window.location.href = `/messages/${thread.id}`;
    } catch (e: any) {
      setMsg(e.message ?? "Error starting message");
    }
  }

  if (loading) return <div className="text-white/75">Loading…</div>;
  if (!l) return <Card>Listing not found.</Card>;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card className="overflow-hidden p-0">
          <div className="aspect-video w-full bg-[#141414]">
            {heroVideoUrl ? (
              <video className="h-full w-full object-cover" src={heroVideoUrl} controls playsInline preload="metadata" />
            ) : photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-full w-full object-cover" src={publicUrl(photos[0].storage_bucket, photos[0].storage_path)} alt="" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/55">No video yet</div>
            )}
          </div>
        </Card>

        {photos.length > 0 ? (
          <Card>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.slice(0, 9).map(p => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} className="aspect-video w-full rounded-lg object-cover" src={publicUrl(p.storage_bucket, p.storage_path)} alt="" />
              ))}
            </div>
          </Card>
        ) : null}

        <Card>
          <h2 className="text-lg font-bold">Story</h2>
          <p className="mt-2 whitespace-pre-wrap text-white/85">{l.description || "No description yet."}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Q&A</h2>
          <div className="mt-3 flex gap-2">
            <Textarea rows={2} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ask a question or leave a comment…" />
            <Button onClick={postComment}>Post</Button>
          </div>
          {msg ? <div className="mt-3 rounded-lg bg-[#0f0f0f]/5 p-3 text-sm text-white/85">{msg}</div> : null}
          <div className="mt-4 space-y-3">
            {comments.length === 0 ? (
              <div className="text-sm text-white/75">No comments yet.</div>
            ) : comments.map(c => (
              <div key={c.id} className="rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-800">{c.profiles?.full_name || "User"}</div>
                  <div className="text-xs text-white/55">{formatDate(c.created_at)}</div>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">{c.body}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{l.title}</h1>
            <div className="text-right text-2xl font-extrabold">{formatMoney(l.price)}</div>
          </div>
          <div className="mt-2 text-white/75">{l.beds} bd • {l.baths} ba {l.sqft ? `• ${l.sqft.toLocaleString()} sqft` : ""}</div>
          <div className="mt-1 text-white/75">{l.address}, {l.city}, {l.state} {l.zip}</div>

          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={startMessageThread}>Message seller</Button>
            <Button variant="secondary" onClick={() => navigator.share?.({ title: l.title, url: window.location.href }).catch(()=>{})}>
              Share
            </Button>
            <Link className="text-sm text-white/75 hover:text-white" href="/">← Back to feed</Link>
          </div>
          {msg ? <div className="mt-3 rounded-lg bg-[#0f0f0f]/5 p-3 text-sm text-white/85">{msg}</div> : null}
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Sponsored</h2>
          <p className="mt-1 text-sm text-white/75">
            MVP placeholder: this slot becomes your “Verified Pros” ad unit (lenders, inspectors, contractors).
          </p>
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3 text-sm text-white/85">
            Example: “Get pre-approved in 5 minutes” • “Home inspection booking”
          </div>
        </Card>
      </div>
    </div>
  );
}
