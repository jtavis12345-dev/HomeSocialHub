import { RequireAuth } from "@/components/RequireAuth";
import { ThreadsList } from "@/components/ThreadsList";

export default function Page() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Messages</h1>
        <p className="mt-2 text-white/75">Your conversations about listings.</p>
        <div className="mt-6">
          <ThreadsList />
        </div>
      </main>
    </RequireAuth>
  );
}
