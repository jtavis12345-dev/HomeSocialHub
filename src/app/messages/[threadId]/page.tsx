import { RequireAuth } from "@/components/RequireAuth";
import { MessageThread } from "@/components/MessageThread";

export default function Page({ params }: { params: { threadId: string } }) {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <MessageThread threadId={params.threadId} />
      </main>
    </RequireAuth>
  );
}
