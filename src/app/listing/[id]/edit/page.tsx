import { EditListingForm } from "@/components/EditListingForm";

export default function EditListingPage({ params }: { params: { id: string } }) {
  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-10">
      <EditListingForm listingId={params.id} />
    </main>
  );
}
