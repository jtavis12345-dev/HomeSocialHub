import { RequireAuth } from "@/components/RequireAuth";
import { CreateListingForm } from "@/components/CreateListingForm";

export default function Page() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Create listing</h1>
        <p className="mt-2 text-white/75">Add details, then upload photos and a video.</p>
        <div className="mt-6">
          <CreateListingForm />
        </div>
      </main>
    </RequireAuth>
  );
}
