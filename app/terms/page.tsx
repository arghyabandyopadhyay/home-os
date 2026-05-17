import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function TermsPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>

      <p className="text-app-muted">Last updated: January 1, 2025</p>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          Acceptable Use
        </h2>
        <p className="leading-relaxed">
          You agree to use Home OS only for lawful purposes and in a manner
          consistent with its intended use as a personal organization tool. You
          may not use the platform to store, transmit, or distribute content
          that is illegal, harmful, threatening, abusive, or otherwise
          objectionable. Automated access, scraping, or any activity that
          disrupts the service for other users is prohibited.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          Account Responsibilities
        </h2>
        <p className="leading-relaxed">
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity that occurs under your
          account. You agree to notify us immediately of any unauthorized use of
          your account. Home OS is designed for individual use and accounts may
          not be shared with or transferred to other individuals.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          Intellectual Property
        </h2>
        <p className="leading-relaxed">
          All content you create within Home OS — including notes, tasks, and
          other personal data — remains your intellectual property. The Home OS
          platform, its design, code, and branding are the intellectual property
          of the Home OS team. You may not copy, modify, or distribute any part
          of the platform without prior written permission.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          Limitation of Liability
        </h2>
        <p className="leading-relaxed">
          Home OS is provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis without warranties of any kind, either express
          or implied. We do not guarantee that the service will be
          uninterrupted, secure, or error-free. In no event shall the Home OS
          team be liable for any indirect, incidental, special, or consequential
          damages arising from your use of the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Termination</h2>
        <p className="leading-relaxed">
          We reserve the right to suspend or terminate your account if you
          violate these terms or engage in activity that harms the platform or
          other users. You may delete your account at any time through the
          Settings page. Upon termination, your data will be permanently removed
          from our systems within 30 days, except where retention is required by
          law.
        </p>
      </section>
    </LegalPageShell>
  );
}
