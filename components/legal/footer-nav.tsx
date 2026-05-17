import Link from "next/link";

export function FooterNav() {
  return (
    <nav aria-label="Footer">
      <div className="flex items-center justify-center gap-6">
        <Link href="/privacy" className="link-muted min-h-[44px] min-w-[44px] flex items-center">
          Privacy Policy
        </Link>
        <Link href="/terms" className="link-muted min-h-[44px] min-w-[44px] flex items-center">
          Terms of Service
        </Link>
        <Link href="/contact" className="link-muted min-h-[44px] min-w-[44px] flex items-center">
          Contact
        </Link>
      </div>
    </nav>
  );
}
