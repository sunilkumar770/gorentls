import { supabase } from '@/lib/supabase';

/**
 * Uploads a file to Supabase storage with a timeout wrapper for resilience.
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
  timeoutMs: number = 30000 // 30s default timeout
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        // @ts-ignore - Supabase storage client supports signal in newer versions
        signal: controller.signal,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw error;
  }
}
