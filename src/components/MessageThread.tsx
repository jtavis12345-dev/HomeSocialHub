"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Msg = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function MessageThread({ threadId }: { threadId: string }) {
  const supabase = supabaseBrowser();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { window.location.href = "/login"; return; }
    setMe(user.id);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) console.error(error);
    setMsgs((data as any) ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  useEffect(() => { load(); }, [threadId]);

  async function send() {
    setErr(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { window.location.href = "/login"; return; }
      const text = body.trim();
      if (!text) return;

      const { error } = await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user.id,
        body: text
      });
      if (error) throw error;
      setBody("");
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Conversation</h1>
          <div className="text-sm text-white/75">Thread {threadId.slice(0, 10)}…</div>
        </div>
        <Link className="text-sm text-white/85 hover:text-white" href="/messages">← Back</Link>
      </div>

      <Card className="h-[60vh] overflow-y-auto p-4">
        <div className="space-y-2">
          {msgs.map(m => (
            <div key={m.id} className={me === m.sender_id ? "flex justify-end" : "flex justify-start"}>
              <div className={me === m.sender_id ? "max-w-[80%] rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white" : "max-w-[80%] rounded-2xl bg-[#141414] px-3 py-2 text-sm text-white"}>
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className={me === m.sender_id ? "mt-1 text-[11px] text-blue-100" : "mt-1 text-[11px] text-white/55"}>
                  {formatDate(m.created_at)}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </Card>

      {err ? <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

      <Card className="flex items-center gap-2">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <Button onClick={send}>Send</Button>
      </Card>
    </div>
  );
}
