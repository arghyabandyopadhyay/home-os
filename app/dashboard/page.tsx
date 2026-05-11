import { ensureProfile } from "@/lib/create-profile"

export default async function DashboardPage() {
  const user = await ensureProfile()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          Welcome back
        </h1>

        <p className="mt-2 text-zinc-400">
          {user?.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Tasks
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Notes
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Reading
          </h2>
        </div>
      </div>
    </div>
  )
}