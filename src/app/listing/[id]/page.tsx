import { ListingDetail } from "@/components/ListingDetail";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <ListingDetail listingId={params.id} />
    </main>
  );
}
