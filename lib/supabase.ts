import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
}

export function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SECRET_KEY);
}

export async function sessionClient() {
  const jar = await cookies();
  return createServerClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (entries) => {
          try {
            for (const { name, value, options } of entries) jar.set(name, value, options);
          } catch {
            // Server Components can read cookies but cannot mutate them.
          }
        },
      },
    },
  );
}

export function adminClient() {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
