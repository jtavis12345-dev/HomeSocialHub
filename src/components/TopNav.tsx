"use client";

import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { useEffect, useState } from "react";
import Image from "next/image";

export function TopNav() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="sticky top-0 z-20 border-b border-[#2a2a2a] bg-black/70 backdrop-blur">
      {/* Full-width nav (no max-width container) */}
      <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/homesocial-logo.png"
              alt="HomeSocial"
              width={150}
              height={150}
              className="h-14 w-14 rounded-md object-contain sm:h-16 sm:w-16"
              priority
            />
            <span className="text-xl font-extrabold tracking-tight text-[#D4AF37] sm:text-2xl">
              HomeSocial
            </span>
          </Link>

          <nav className="hidden items-center gap-4 sm:flex">
            <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/create">
              Create Listing
            </Link>
            {email ? (
              <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/my-listings">
                My Listings
              </Link>
            ) : null}
            <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/messages">
              Messages
            </Link>
            <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/profile">
              Profile
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden text-sm text-white/70 sm:block">{email}</span>
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
      <div className="flex items-center gap-4 border-t border-[#2a2a2a] px-4 py-2 sm:hidden">
        <Link className="text-xs text-white/80 hover:text-[#D4AF37]" href="/create">
          Create
        </Link>
        {email ? (
          <Link className="text-xs text-white/80 hover:text-[#D4AF37]" href="/my-listings">
            My Listings
          </Link>
        ) : null}
        <Link className="text-xs text-white/80 hover:text-[#D4AF37]" href="/messages">
          Messages
        </Link>
        <Link className="text-xs text-white/80 hover:text-[#D4AF37]" href="/profile">
          Profile
        </Link>
      </div>
    </div>
  );
}
