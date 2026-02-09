"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

type ListingEditable = {
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
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notOwner, setNotOwner] = useState(false);

  const [form, setForm] = useState<ListingEditable | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      setNotOwner(false);

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      if (!uid) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("id,owner_id,title,price,beds,baths,sqft,address,city,state,zip,description")
        .eq("id", listingId)
        .single();

      if (error) {
        console.error(error);
        setErr(error.message);
        setForm(null);
        setLoading(false);
        return;
      }

      const row = data as any as ListingEditable;
      if (row.owner_id !== uid) {
        setNotOwner(true);
        setForm(row);
        setLoading(false);
        return;
      }

      setForm(row);
      setLoading(false);
    })();
  }, [listingId, supabase]);

  const canSave = useMemo(() => {
    if (!form) return false;
    return form.title.trim().length > 0;
  }, [form]);

  async function onSave() {
    if (!form) return;
    setErr(null);
    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      if (!uid) {
        window.location.href = "/login";
        return;
      }
      if (form.owner_id !== uid) {
        setNotOwner(true);
        return;
      }

      const payload = {
        title: form.title.trim(),
        price: form.price,
        beds: form.beds,
        baths: form.baths,
        sqft: form.sqft,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        description: form.description,
      };

      const { error } = await supabase.from("listings").update(payload).eq("id", listingId);
      if (error) throw error;

      router.push(`/listing/${listingId}`);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setErr(e.message ?? "Error saving listing");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-white/75">Loading…</div>;
  if (err) return <div className="text-red-400">Error: {err}</div>;
  if (!form) return <div className="text-white/75">Listing not found.</div>;

  if (notOwner) {
    return (
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6">
        <h1 className="text-2xl font-extrabold">You can’t edit this listing</h1>
        <p className="mt-2 text-white/70">
          Only the owner of a listing can edit it.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href={`/listing/${listingId}`}>
            <Button variant="secondary">Back to listing</Button>
          </Link>
          <Link href="/my-listings">
            <Button>My Listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Listing</h1>
          <p className="text-white/70">Update your listing details (media editing can be added next).</p>
        </div>
        <Link href={`/listing/${listingId}`}>
          <Button variant="secondary">Cancel</Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-white/70">Title</div>
          <input
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.title ?? ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">Price</div>
          <input
            type="number"
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.price ?? ""}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">Beds</div>
          <input
            type="number"
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.beds ?? ""}
            onChange={(e) =>
              setForm({ ...form, beds: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">Baths</div>
          <input
            type="number"
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.baths ?? ""}
            onChange={(e) =>
              setForm({ ...form, baths: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">Sqft</div>
          <input
            type="number"
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.sqft ?? ""}
            onChange={(e) =>
              setForm({ ...form, sqft: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">Address</div>
          <input
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">City</div>
          <input
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.city ?? ""}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">State</div>
          <input
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.state ?? ""}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-white/70">ZIP</div>
          <input
            className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
            value={form.zip ?? ""}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
          />
        </label>
      </div>

      <label className="mt-4 block space-y-1">
        <div className="text-sm text-white/70">Description</div>
        <textarea
          rows={6}
          className="w-full rounded-xl border border-[#2a2a2a] bg-black/40 px-3 py-2 text-white outline-none focus:border-[#D4AF37]"
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>

      <div className="mt-6 flex gap-2">
        <Button onClick={onSave} disabled={!canSave || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Link href={`/listing/${listingId}`}>
          <Button variant="secondary">Back</Button>
        </Link>
      </div>
    </div>
  );
}
