import { ListingDetail } from "@/components/ListingDetail";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main className="w-full px-4 py-6 sm:px-8">
      <ListingDetail listingId={params.id} />
    </main>
  );
}
