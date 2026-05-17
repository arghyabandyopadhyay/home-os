import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  const isRecovery = type === "recovery";

  // Handle provider-reported errors
  if (error) {
    const message = errorDescription || "Authentication was denied";
    return NextResponse.redirect(
      new URL(
        `/login?error_description=${encodeURIComponent(message)}`,
        requestUrl.origin,
      ),
    );
  }

  // Handle missing code
  if (!code) {
    if (isRecovery) {
      return NextResponse.redirect(
        new URL(
          "/login?error_description=Reset+link+has+expired.+Please+request+a+new+one.",
          requestUrl.origin,
        ),
      );
    }
    return NextResponse.redirect(
      new URL(
        "/login?error_description=Authorization+code+missing",
        requestUrl.origin,
      ),
    );
  }

  // Exchange code for session
  try {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      if (isRecovery) {
        return NextResponse.redirect(
          new URL(
            "/login?error_description=Reset+link+has+expired.+Please+request+a+new+one.",
            requestUrl.origin,
          ),
        );
      }
      return NextResponse.redirect(
        new URL(
          "/login?error_description=Authentication+failed",
          requestUrl.origin,
        ),
      );
    }
  } catch {
    if (isRecovery) {
      return NextResponse.redirect(
        new URL(
          "/login?error_description=Reset+link+has+expired.+Please+request+a+new+one.",
          requestUrl.origin,
        ),
      );
    }
    return NextResponse.redirect(
      new URL(
        "/login?error_description=Authentication+failed",
        requestUrl.origin,
      ),
    );
  }

  // Recovery flow: redirect to reset password page
  if (isRecovery) {
    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
