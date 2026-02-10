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
};

export function EditListingForm({ listingId }: { listingId: string }) {
  const router = useRouter();

  // ✅ Create Supabase client ONCE (prevents effect re-run loop)
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [row, setRow] = useState<ListingRow | null>(null);

  // Form state
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

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

      // ✅ IMPORTANT: only select listings owned by this user
      const { data, error } = await supabase
        .from("listings")
        .select(
          "id,owner_id,title,price,beds,baths,sqft,address,city,state,zip,description"
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
        // Not found or not yours
        setErr("Listing not found or you don’t have permission to edit it.");
        setRow(null);
        setLoading(false);
        return;
      }

      setRow(data as ListingRow);

      // hydrate form
      setTitle(data.title ?? "");
      setPrice(typeof data.price === "number" ? String(data.price) : "");
      setBeds(typeof data.beds === "number" ? String(data.beds) : "");
      setBaths(typeof data.baths === "number" ? String(data.baths) : "");
      setSqft(typeof data.sqft === "number" ? String(data.sqft) : "");
      setAddress(data.address ?? "");
      setCity(data.city ?? "");
      setStateUS(data.state ?? "");
      setZip(data.zip ?? "");
      setDescription(data.description ?? "");

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [listingId, router, supabase]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;

    setSaving(true);
    setErr(null);

    // Convert numeric fields safely
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
    };

    const { error } = await supabase
      .from("listings")
      .update(payload)
      .eq("id", row.id);

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push(`/listing/${row.id}`);
  }

  if (loading) return <div className="text-white/75">Loading…</div>;
  if (err) return <div className="text-red-400">Error: {err}</div>;
  if (!row) return null;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Edit Listing
          </h1>
          <p className="text-white/70">Update the details and save changes.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push(`/listing/${row.id}`)}>
          Back
        </Button>
      </div>

      <form
        onSubmit={onSave}
        className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6"
      >
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

          <div className="grid grid-cols-3 gap-3 md:col-span-1">
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

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/listing/${row.id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
