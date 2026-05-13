import { createClient } from "@/lib/supabase/server";

export async function getBooks() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getBook(id: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}
