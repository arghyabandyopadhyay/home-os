import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function PrivacyPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>

      <p className="text-app-muted">Last updated: January 1, 2025</p>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Data We Collect
        </h2>
        <p className="leading-relaxed">
          Home OS collects and stores the data you create while using the
          platform. This includes your user profile information, notes, tasks,
          books and reading progress, contacts, and calendar events. We only
          collect data that is necessary to provide you with a functional
          personal organization experience.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          How We Use Your Data
        </h2>
        <p className="leading-relaxed">
          Your data is used solely to power the features you interact with in
          Home OS. We use it to display your notes, manage your tasks, sync your
          calendar, organize your contacts, and track your reading progress. We
          do not sell, share, or use your data for advertising purposes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Data Storage &amp; Security
        </h2>
        <p className="leading-relaxed">
          Your data is stored securely in a managed PostgreSQL database with
          row-level security enabled, ensuring that only you can access your own
          data. All connections are encrypted in transit using TLS, and backups
          are performed regularly. We follow industry-standard security practices
          to protect your information.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Third-Party Services
        </h2>
        <p className="leading-relaxed mb-4">
          Home OS integrates with the following third-party services to provide
          its functionality:
        </p>
        <ul className="list-disc pl-6 space-y-2 leading-relaxed">
          <li>
            <strong>Authentication provider</strong> — Google OAuth for secure
            sign-in
          </li>
          <li>
            <strong>Calendar and contacts integrations</strong> — Google Calendar
            and Google Contacts for syncing your events and people
          </li>
          <li>
            <strong>Database provider</strong> — Supabase for secure data storage
            and real-time functionality
          </li>
          <li>
            <strong>Hosting provider</strong> — Vercel for application hosting
            and delivery
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          Your Rights
        </h2>
        <p className="leading-relaxed">
          You have the right to access, export, and delete your data at any
          time. You can view all data associated with your account directly
          within the app. If you wish to export your data, you may do so through
          the settings page. You can also delete your account and all associated
          data permanently from the account settings. Upon deletion, all your
          data is removed from our systems.
        </p>
      </section>
    </LegalPageShell>
  );
}
