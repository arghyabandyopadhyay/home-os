import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/date";
import { fetchUserPreferences } from "@/lib/user-settings";
import type { Book } from "@/types/book";
import type { Contact } from "@/types/contact";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

export type TodayData = {
  userName: string;
  email: string;
  focusTasks: Task[];
  readingBooks: Book[];
  pinnedNotes: Note[];
  recentNotes: Note[];
  favoriteContacts: Contact[];
  counts: {
    openTasks: number;
    notes: number;
    reading: number;
    contacts: number;
  };
};

export async function getTodayData(): Promise<TodayData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const today = toDateKey();
  const userName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "there";

  // Fetch user preferences to get pinnedNoteIds
  const prefs = await fetchUserPreferences(supabase, user.id);
  const pinnedNoteIds = prefs.pinnedNoteIds ?? [];

  const [
    focusTasksRes,
    readingRes,
    contactsRes,
    openTasksCountRes,
    notesCountRes,
    readingCountRes,
    contactsCountRes,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .not("due_date", "is", null)
      .lte("due_date", `${today}T23:59:59`)
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("books")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "reading")
      .order("updated_at", { ascending: false })
      .limit(3),
    supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("favorite", true)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", false),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "reading"),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  // Fetch pinned notes by IDs, or fall back to 6 most recently updated notes
  let pinnedNotes: Note[] = [];
  if (pinnedNoteIds.length > 0) {
    // Fetch notes matching pinned IDs (up to 6 for dashboard display)
    const displayIds = pinnedNoteIds.slice(0, 6);
    const { data: pinnedData } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .in("id", displayIds);

    // Preserve the pinned order from preferences
    const noteMap = new Map((pinnedData || []).map((n) => [n.id, n]));
    pinnedNotes = displayIds
      .map((id) => noteMap.get(id))
      .filter((n): n is Note => n != null);
  } else {
    // Fall back to 6 most recently updated notes
    const { data: recentData } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6);

    pinnedNotes = (recentData || []) as Note[];
  }

  // Always fetch recent notes for the "Recent notes" section
  const { data: recentNotesData } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(6);

  const recentNotes = (recentNotesData || []) as Note[];

  const focusTasks = (focusTasksRes.data || []) as Task[];

  if (focusTasks.length < 5) {
    const { data: undated } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .is("due_date", null)
      .order("created_at", { ascending: false })
      .limit(5 - focusTasks.length);

    const seen = new Set(focusTasks.map((t) => t.id));
    for (const task of (undated || []) as Task[]) {
      if (!seen.has(task.id)) focusTasks.push(task);
    }
  }

  return {
    userName,
    email: user.email || "",
    focusTasks: focusTasks.slice(0, 8),
    readingBooks: (readingRes.data || []) as Book[],
    pinnedNotes,
    recentNotes,
    favoriteContacts: (contactsRes.data || []) as Contact[],
    counts: {
      openTasks: openTasksCountRes.count ?? 0,
      notes: notesCountRes.count ?? 0,
      reading: readingCountRes.count ?? 0,
      contacts: contactsCountRes.count ?? 0,
    },
  };
}
