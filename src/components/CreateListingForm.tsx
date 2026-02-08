"use client";
import { useState } from "react";
import { z } from "zod";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { uploadToBucket } from "@/lib/media";

const Schema = z.object({
  title: z.string().min(3),
  price: z.coerce.number().min(1),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  sqft: z.coerce.number().nullable().optional(),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
  description: z.string().optional()
});

export function CreateListingForm() {
  const supabase = supabaseBrowser();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    price: "450000",
    beds: "3",
    baths: "2",
    sqft: "1800",
    address: "",
    city: "",
    state: "CA",
    zip: "",
    description: ""
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      const parsed = Schema.parse({
        ...form,
        sqft: form.sqft ? Number(form.sqft) : null
      });

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in.");

      // 1) Create listing (draft)
      const { data: listing, error: e1 } = await supabase
        .from("listings")
        .insert({
          owner_id: user.id,
          title: parsed.title,
          price: parsed.price,
          beds: parsed.beds,
          baths: parsed.baths,
          sqft: parsed.sqft ?? null,
          address: parsed.address,
          city: parsed.city,
          state: parsed.state.toUpperCase(),
          zip: parsed.zip,
          description: parsed.description ?? null,
          status: "draft"
        })
        .select()
        .single();

      if (e1) throw e1;

      // 2) Upload media to storage + create media rows
      const mediaRows: any[] = [];
      const prefix = `listing/${listing.id}`;

      if (video) {
        const path = await uploadToBucket({ bucket: "listing-videos", file: video, pathPrefix: prefix });
        mediaRows.push({
          listing_id: listing.id,
          type: "video",
          storage_bucket: "listing-videos",
          storage_path: path,
          thumbnail_path: null,
          sort_order: 0
        });
      }

      if (photos && photos.length > 0) {
        const files = Array.from(photos);
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const path = await uploadToBucket({ bucket: "listing-photos", file: f, pathPrefix: prefix });
          mediaRows.push({
            listing_id: listing.id,
            type: "photo",
            storage_bucket: "listing-photos",
            storage_path: path,
            thumbnail_path: null,
            sort_order: (video ? 1 : 0) + i
          });
        }
      }

      if (mediaRows.length > 0) {
        const { error: e2 } = await supabase.from("media").insert(mediaRows);
        if (e2) throw e2;
      }

      // 3) Publish
      const { error: e3 } = await supabase
        .from("listings")
        .update({ status: "active" })
        .eq("id", listing.id);
      if (e3) throw e3;

      window.location.href = `/listing/${listing.id}`;
    } catch (e: any) {
      setMsg(e.message ?? "Error creating listing");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">Title</div>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Modern ranch near downtown" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">Price</div>
          <Input value={form.price} onChange={(e) => set("price", e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">Beds</div>
          <Input value={form.beds} onChange={(e) => set("beds", e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">Baths</div>
          <Input value={form.baths} onChange={(e) => set("baths", e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">Sqft (optional)</div>
          <Input value={form.sqft} onChange={(e) => set("sqft", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <div className="text-sm font-semibold text-white/85">Address</div>
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Main St" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">City</div>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">State</div>
          <Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="CA" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">ZIP</div>
          <Input value={form.zip} onChange={(e) => set("zip", e.target.value)} placeholder="90210" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/85">Description</div>
        <Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell the story. What makes this home special?" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">Listing video (MP4 recommended)</div>
          <Input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
          <div className="text-xs text-white/55">MVP: upload a single hero video.</div>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white/85">Photos (multi-select)</div>
          <Input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
        </div>
      </div>

      {msg ? <div className="rounded-lg bg-[#0f0f0f]/5 p-3 text-sm text-white/85">{msg}</div> : null}

      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Publishing…" : "Publish listing"}
        </Button>
        <div className="text-sm text-white/75">Your listing will be live immediately (MVP).</div>
      </div>
    </Card>
  );
}
