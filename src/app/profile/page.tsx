import { RequireAuth } from "@/components/RequireAuth";
import { ProfilePage } from "@/components/ProfilePage";

export default function Page() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Profile</h1>
        <p className="mt-2 text-white/75">Set your name and role (seller/buyer/pro).</p>
        <div className="mt-6">
          <ProfilePage />
        </div>
      </main>
    </RequireAuth>
  );
}
