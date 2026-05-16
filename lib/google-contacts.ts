import type { SupabaseClient } from "@supabase/supabase-js";

const GOOGLE_PEOPLE_API_URL =
  "https://people.googleapis.com/v1/people/me/connections";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

type GooglePersonName = {
  displayName?: string;
  givenName?: string;
  familyName?: string;
};

type GooglePersonEmail = {
  value?: string;
};

type GooglePersonPhone = {
  value?: string;
};

type GooglePersonOrganization = {
  name?: string;
  title?: string;
};

export type GooglePerson = {
  resourceName?: string;
  names?: GooglePersonName[];
  emailAddresses?: GooglePersonEmail[];
  phoneNumbers?: GooglePersonPhone[];
  organizations?: GooglePersonOrganization[];
};

/**
 * Map a Google People API person object to a partial contact record.
 * Pure function — suitable for property-based testing.
 */
export function mapGoogleContact(person: GooglePerson): {
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
} {
  const name = person.names?.[0]?.displayName || null;
  const email = person.emailAddresses?.[0]?.value || null;
  const phone = person.phoneNumbers?.[0]?.value || null;
  const company = person.organizations?.[0]?.name || null;
  const role = person.organizations?.[0]?.title || null;
  return { name, email, phone, company, role };
}

type GooglePeopleResponse = {
  connections?: GooglePerson[];
  nextPageToken?: string;
  totalPeople?: number;
  error?: {
    message?: string;
    code?: number;
  };
};

type ImportResult = {
  imported: number;
  updated: number;
};

/**
 * Import contacts from Google People API into the local contacts table.
 * Upserts by google_contact_id. Skips contacts with source='manual'.
 */
export async function importGoogleContacts(
  supabase: SupabaseClient,
  userId: string,
  accessToken: string,
): Promise<ImportResult> {
  let imported = 0;
  let updated = 0;
  let pageToken: string | undefined;

  do {
    const url = new URL(GOOGLE_PEOPLE_API_URL);
    url.searchParams.set(
      "personFields",
      "names,emailAddresses,phoneNumbers,organizations",
    );
    url.searchParams.set("pageSize", "100");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const data = (await response.json()) as GooglePeopleResponse;

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message || "Failed to fetch Google Contacts",
      );
    }

    const connections = data.connections || [];

    for (const person of connections) {
      const googleContactId = person.resourceName;
      if (!googleContactId) continue;

      const name = person.names?.[0]?.displayName;
      if (!name) continue; // Skip contacts without a name

      const email = person.emailAddresses?.[0]?.value || null;
      const phone = person.phoneNumbers?.[0]?.value || null;
      const company = person.organizations?.[0]?.name || null;
      const role = person.organizations?.[0]?.title || null;

      // Check if a manual contact exists with this google_contact_id
      // (shouldn't happen, but be safe)
      const { data: existing } = await supabase
        .from("contacts")
        .select("id, source")
        .eq("user_id", userId)
        .eq("google_contact_id", googleContactId)
        .maybeSingle();

      if (existing && existing.source === "manual") {
        // Never overwrite manually created contacts
        continue;
      }

      if (existing) {
        // Update existing imported contact
        const { error } = await supabase
          .from("contacts")
          .update({
            name,
            email,
            phone,
            company,
            role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (!error) updated++;
      } else {
        // Insert new contact from Google
        const { error } = await supabase.from("contacts").insert({
          user_id: userId,
          name,
          email,
          phone,
          company,
          role,
          google_contact_id: googleContactId,
          source: "google",
          favorite: false,
        });

        if (!error) imported++;
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { imported, updated };
}

/**
 * Get the Google OAuth config for contacts.
 * Falls back to calendar OAuth credentials if contacts-specific ones aren't set.
 */
export function getGoogleContactsOAuthConfig(requestUrl: string) {
  const clientId =
    process.env.GOOGLE_CONTACTS_CLIENT_ID ||
    process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CONTACTS_CLIENT_SECRET ||
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUri = new URL(
    "/api/google-contacts/callback",
    requestUrl,
  ).toString();

  return { clientId, clientSecret, redirectUri };
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeGoogleContactsCode({
  code,
  requestUrl,
}: {
  code: string;
  requestUrl: string;
}) {
  const { clientId, clientSecret, redirectUri } =
    getGoogleContactsOAuthConfig(requestUrl);

  if (!clientId || !clientSecret) {
    throw new Error("Google Contacts OAuth is not configured");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const token = await response.json();
  if (!response.ok || token.error || !token.access_token) {
    throw new Error(
      token.error_description || "Could not connect Google Contacts",
    );
  }

  return token as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };
}

/**
 * Refresh an expired access token using the stored refresh token.
 */
export async function refreshGoogleContactsToken(
  refreshToken: string,
  requestUrl: string,
) {
  const { clientId, clientSecret } =
    getGoogleContactsOAuthConfig(requestUrl);

  if (!clientId || !clientSecret) {
    throw new Error("Google Contacts OAuth is not configured");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  const token = await response.json();
  if (!response.ok || token.error || !token.access_token) {
    throw new Error(
      token.error_description || "Could not refresh Google Contacts token",
    );
  }

  return token as {
    access_token: string;
    expires_in?: number;
    scope?: string;
  };
}
