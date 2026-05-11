import { supabase } from "@/lib/supabase"

export default async function TestPage() {
  const { data, error } = await supabase
  .from("test")
  .select("*")
  .order("created_at", { ascending: false })

  return (
    <div className="p-10">
      <h1 className="mb-4 text-2xl font-bold">
        Supabase Test
      </h1>

      <pre className="rounded-xl bg-zinc-900 p-4 text-sm">
        {JSON.stringify(
          {
            data,
            error,
          },
          null,
          2
        )}
      </pre>
    </div>
  )
}