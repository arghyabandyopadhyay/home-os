import { getBooks } from "@/lib/books";
import { LibraryView } from "@/components/library/library-view";
import { ensureProfile } from "@/lib/create-profile";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";

export default async function LibraryPage() {
  const user = await ensureProfile();

  if (!user) {
    redirect("/login");
  }

  const books = await getBooks();

  return (
    <PageShell
      title="Library"
      description="Your personal reading space"
    >
      <LibraryView books={books} />
    </PageShell>
  );
}
