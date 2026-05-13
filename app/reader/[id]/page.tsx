import { createClient } from "@/lib/supabase/server";

import { EpubReader } from "@/components/library/epub-reader";
import { PdfReader } from "@/components/library/pdf-reader";

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (!book?.file_path) {
    return <div className="p-8">No file uploaded</div>;
  }

  const { data: signedUrlData } = await supabase.storage
    .from("books")
    .createSignedUrl(book.file_path, 60 * 60);

  const isPdf = book.file_type?.toLowerCase().includes("pdf");

  return (
    <div className="h-screen bg-[#09090b] text-white">
      {isPdf ? (
        <PdfReader url={signedUrlData?.signedUrl || ""} />
      ) : (
        <EpubReader url={signedUrlData?.signedUrl || ""} />
      )}
    </div>
  );
}
