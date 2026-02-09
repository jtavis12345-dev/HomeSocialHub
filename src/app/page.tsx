import { Feed } from "@/components/Feed";

export default function Page() {
  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">HomeSocial</h1>
          <p className="text-white/70">Video-first listings + listing-centered social.</p>
        </div>
      </div>

      <div className="mt-6">
        <Feed />
      </div>
    </main>
  );
}
