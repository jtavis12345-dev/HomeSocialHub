import { supabaseBrowser } from "@/lib/supabase/client";

export async function uploadToBucket(params: {
  bucket: string;
  file: File;
  pathPrefix: string;
}) {
  const supabase = supabaseBrowser();
  const ext = params.file.name.split(".").pop() || "bin";
  const path = `${params.pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(params.bucket).upload(path, params.file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;
  return path;
}

export function publicUrl(bucket: string, path: string) {
  const supabase = supabaseBrowser();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
