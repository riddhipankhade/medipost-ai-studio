import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl)  console.error("[supabase] VITE_SUPABASE_URL is not set");
if (!supabaseKey)  console.error("[supabase] VITE_SUPABASE_ANON_KEY is not set");

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);


export async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated. Please sign in.");
  }

  const res = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}`,
    {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err?.error ?? err?.message ?? `Edge function error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}