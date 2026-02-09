"use client";

import Link from "next/link";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { useEffect, useState } from "react";

export function TopNav() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-black/70 backdrop-blur">
      {/* Full-width row (no max-w container) */}
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/homesocial-logo.png"
                alt="HomeSocial"
                width={120}
                height={120}
                priority
                unoptimized
                className="h-[120px] w-[120px] rounded-md"
              />
              <span className="text-2xl font-extrabold tracking-tight text-[#D4AF37]">
                HomeSocial
              </span>
            </Link>

            <nav className="hidden items-center gap-5 md:flex">
              <Link className="text-base text-white/80 hover:text-[#D4AF37]" href="/create">
                Create Listing
              </Link>
              <Link className="text-base text-white/80 hover:text-[#D4AF37]" href="/messages">
                Messages
              </Link>
              <Link className="text-base text-white/80 hover:text-[#D4AF37]" href="/profile">
                Profile
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {email ? (
              <>
                <span className="hidden text-sm text-white/70 lg:block">{email}</span>
                <Button variant="secondary" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>Sign in</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="mt-3 flex items-center gap-4 md:hidden">
          <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/create">
            Create Listing
          </Link>
          <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/messages">
            Messages
          </Link>
          <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/profile">
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
