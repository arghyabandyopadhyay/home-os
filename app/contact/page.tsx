import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function ContactPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Contact Us</h1>

      <section>
        <p className="leading-relaxed">
          Have a question, concern, or suggestion? We'd love to hear from you.
          Reach us by email at{" "}
          <a
            href="mailto:businessgenie9@gmail.com"
            className="underline hover:text-app-muted"
          >
            businessgenie9@gmail.com
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Response Time</h2>
        <p className="leading-relaxed">
          We aim to respond to all inquiries within 2 business days. During
          weekends and holidays, responses may take slightly longer.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold tracking-tight">
          What You Can Reach Us About
        </h2>
        <p className="leading-relaxed">
          Feel free to email us about any of the following:
        </p>
        <ul className="list-disc pl-6 space-y-2 leading-relaxed">
          <li>Account issues and login problems</li>
          <li>Privacy and data deletion requests</li>
          <li>Bug reports and feature suggestions</li>
          <li>General questions about Home OS</li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
