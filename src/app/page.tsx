import { Feed } from "@/components/Feed";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">HomeSocial</h1>
          <p className="mt-1 text-white/75">Video-first listings + listing-centered social.</p>
        </div>
      </div>
      <div className="mt-6">
        <Feed />
      </div>
    </main>
  );
}
