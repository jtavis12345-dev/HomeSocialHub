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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/homesocial-logo.png"
              alt="HomeSocial"
              width={34}
              height={34}
              priority
              unoptimized
              className="h-[34px] w-[34px] rounded-sm"
            />
            <span className="text-lg font-extrabold tracking-tight text-[#D4AF37]">
              HomeSocial
            </span>
          </Link>

          <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/create">Create Listing</Link>
          <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/messages">Messages</Link>
          <Link className="text-sm text-white/80 hover:text-[#D4AF37]" href="/profile">Profile</Link>
        </div>

        <div className="flex items-center gap-3">
          {email ? (
            <>
              <span className="hidden text-sm text-white/70 sm:block">{email}</span>
              <Button variant="secondary" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Link href="/login"><Button>Sign in</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}
