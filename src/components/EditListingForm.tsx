"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

type ListingRow = {
  id: string;
  owner_id: string;
  title: string;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  description: string | null;

  photo_urls: string[];
  video_urls: string[];
  thumbnail_url: string | null;
};

export function EditListingForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [row, setRow] = useState<ListingRow | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [beds, setBeds] = useState<string>("");
  const [baths, setBaths] = useState<string>("");
  const [sqft, setSqft] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [stateUS, setStateUS] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Media state
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      setOk(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      if (userErr) {
        if (!cancelled) setErr(userErr.message);
        if (!cancelled) setLoading(false);
        return;
      }

      if (!uid) {
        router.replace("/login");
        return;
      }

      // Only load if it’s your listing
      const { data, error } = await supabase
        .from("listings")
        .select(
          "id,owner_id,title,price,beds,baths,sqft,address,city,state,zip,description,photo_urls,video_urls,thumbnail_url"
        )
        .eq("id", listingId)
        .eq("owner_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setErr(error.message);
        setRow(null);
        setLoading(false);
        return;
      }

      if (!data) {
        setErr("Listing not found or you don’t have permission to edit it.");
        setRow(null);
        setLoading(false);
        return;
      }

      const r = data as ListingRow;
      setRow(r);

      setTitle(r.title ?? "");
      setPrice(typeof r.price === "number" ? String(r.price) : "");
      setBeds(typeof r.beds === "number" ? String(r.beds) : "");
      setBaths(typeof r.baths === "number" ? String(r.baths) : "");
      setSqft(typeof r.sqft === "number" ? String(r.sqft) : "");
      setAddress(r.address ?? "");
      setCity(r.city ?? "");
      setStateUS(r.state ?? "");
      setZip(r.zip ?? "");
      setDescription(r.description ?? "");

      setPhotoUrls(Array.isArray(r.photo_urls) ? r.photo_urls : []);
      setVideoUrls(Array.isArray(r.video_urls) ? r.video_urls : []);
      setThumbnailUrl(r.thumbnail_url ?? (r.photo_urls?.[0] ?? null));

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, router, supabase]);

  async function uploadToBucket(bucket: "listing-photos" | "listing-videos", file: File) {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${listingId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function addPhoto(file: File) {
    setErr(null);
    setOk(null);
    const url = await uploadToBucket("listing-photos", file);
    const next = [...photoUrls, url];
    setPhotoUrls(next);
    if (!thumbnailUrl) setThumbnailUrl(url);
  }

  async function addVideo(file: File) {
    setErr(null);
    setOk(null);
    const url = await uploadToBucket("listing-videos", file);
    const next = [...videoUrls, url];
    setVideoUrls(next);
  }

  function removePhoto(url: string) {
    const next = photoUrls.filter((u) => u !== url);
    setPhotoUrls(next);
    if (thumbnailUrl === url) setThumbnailUrl(next[0] ?? null);
  }

  function removeVideo(url: string) {
    const next = videoUrls.filter((u) => u !== url);
    setVideoUrls(next);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;

    setSaving(true);
    setErr(null);
    setOk(null);

    const priceNum = price.trim() ? Number(price) : null;
    const bedsNum = beds.trim() ? Number(beds) : null;
    const bathsNum = baths.trim() ? Number(baths) : null;
    const sqftNum = sqft.trim() ? Number(sqft) : null;

    const payload = {
      title: title.trim(),
      price: Number.isFinite(priceNum as any) ? priceNum : null,
      beds: Number.isFinite(bedsNum as any) ? bedsNum : null,
      baths: Number.isFinite(bathsNum as any) ? bathsNum : null,
      sqft: Number.isFinite(sqftNum as any) ? sqftNum : null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: stateUS.trim() || null,
      zip: zip.trim() || null,
      description: description.trim() || null,

      photo_urls: photoUrls,
      video_urls: videoUrls,
      thumbnail_url: thumbnailUrl,
    };

    const { error } = await supabase.from("listings").update(payload).eq("id", row.id);
    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    setOk("Saved!");
    setSaving(false);
    router.push(`/listing/${row.id}`);
  }

  if (loading) return <div className="text-white/75">Loading…</div>;
  if (err) return <div className="text-red-400">Error: {err}</div>;
  if (!row) return null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Edit Listing</h1>
          <p className="text-white/70">Update details, manage photos/videos, and choose a thumbnail.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push(`/listing/${row.id}`)}>
          Back
        </Button>
      </div>

      <form onSubmit={onSave} className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6">
        {/* BASIC FIELDS */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Title</label>
            <input
              className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Price</label>
            <input
              className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="numeric"
              placeholder="575000"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-white/70">Beds</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Baths</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Sqft</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Address</label>
            <input
              className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-white/70">City</label>
            <input
              className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/70">State</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                value={stateUS}
                onChange={(e) => setStateUS(e.target.value)}
                placeholder="AZ"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">ZIP</label>
              <input
                className="mt-1 w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Description</label>
            <textarea
              className="mt-1 min-h-[140px] w-full rounded-xl border border-[#2a2a2a] bg-black px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* MEDIA SECTION */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold text-white">Media</h2>
          <p className="mt-1 text-sm text-white/70">
            Add/remove photos and videos. Select one photo as the thumbnail.
          </p>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {/* Photos */}
            <div>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white">Photos</div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        await addPhoto(f);
                      } catch (ex: any) {
                        setErr(ex?.message ?? "Photo upload failed");
                      }
                    }}
                  />
                  <span className="rounded-xl bg-[#D4AF37] px-3 py-2 text-sm font-bold text-black">
                    + Add Photo
                  </span>
                </label>
              </div>

              {photoUrls.length === 0 ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
                  No photos yet.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {photoUrls.map((u) => (
                    <div key={u} className="rounded-xl border border-white/10 bg-black/40 p-2">
                      <img src={u} alt="photo" className="h-32 w-full rounded-lg object-cover" />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setThumbnailUrl(u)}
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                            thumbnailUrl === u ? "bg-[#D4AF37] text-black" : "bg-white/10 text-white"
                          }`}
                        >
                          {thumbnailUrl === u ? "Thumbnail" : "Set thumbnail"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(u)}
                          className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Videos */}
            <div>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white">Videos</div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        await addVideo(f);
                      } catch (ex: any) {
                        setErr(ex?.message ?? "Video upload failed");
                      }
                    }}
                  />
                  <span className="rounded-xl bg-[#D4AF37] px-3 py-2 text-sm font-bold text-black">
                    + Add Video
                  </span>
                </label>
              </div>

              {videoUrls.length === 0 ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
                  No videos yet.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {videoUrls.map((u) => (
                    <div key={u} className="rounded-xl border border-white/10 bg-black/40 p-3">
                      <video src={u} controls className="w-full rounded-lg" />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeVideo(u)}
                          className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {ok && <span className="text-sm text-green-300">{ok}</span>}
          {err && <span className="text-sm text-red-200">{err}</span>}
        </div>
      </form>
    </div>
  );
}
