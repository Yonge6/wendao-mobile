import type { SupabaseClient } from "@supabase/supabase-js";

export type CompanionThread = { id: string; title: string | null; chapter_id: number | null; locale: "zh" | "en"; last_message_at: string };
export type SavedMessage = { id: string; role: "user" | "assistant"; content: string; chapter_id: number | null; created_at: string };

export async function loadRecentThreads(client: SupabaseClient, userId: string, signal: AbortSignal): Promise<CompanionThread[]> {
  if (!userId) throw new Error("An authenticated account is required");
  const { data, error } = await client.from("wendao_threads")
    .select("id,title,chapter_id,locale,last_message_at")
    .eq("user_id", userId).eq("status", "active")
    .order("last_message_at", { ascending: false }).limit(20).abortSignal(signal);
  if (error) throw error;
  return data ?? [];
}

export async function loadThreadMessages(client: SupabaseClient, userId: string, threadId: string, signal: AbortSignal): Promise<SavedMessage[]> {
  if (!userId || !threadId) throw new Error("An authenticated conversation is required");
  const { data, error } = await client.from("wendao_messages")
    .select("id,role,content,chapter_id,created_at")
    .eq("user_id", userId).eq("thread_id", threadId)
    .order("created_at", { ascending: false }).order("role", { ascending: true })
    .limit(40).abortSignal(signal);
  if (error) throw error;
  return (data ?? []).slice().reverse();
}
