import type { SupabaseClient } from "@supabase/supabase-js";

const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/userinfo.email";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleCalendarDate = {
  date?: string;
  dateTime?: string;
};

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: GoogleCalendarDate;
  end?: GoogleCalendarDate;
};

type GoogleEventsResponse = {
  items?: GoogleCalendarEvent[];
  error?: {
    message?: string;
  };
};

type CalendarConnection = {
  id: string;
  user_id: string;
  provider: string;
  calendar_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string | null;
};

type SyncedCalendarEventRow = {
  user_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  source: string;
  external_id: string;
  external_calendar_id: string;
  html_link: string | null;
  location: string | null;
  updated_at: string;
};

// Custom error classes for structured error handling
export class ReconnectRequiredError extends Error {
  constructor(message?: string) {
    super(message || "Google Calendar reconnection required");
    this.name = "ReconnectRequiredError";
  }
}

export class GoogleApiError extends Error {
  public statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "GoogleApiError";
    this.statusCode = statusCode;
  }
}

// Fetch the authenticated user's email from Google
export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { email?: string };
    return data.email || null;
  } catch {
    return null;
  }
}

export function getGoogleCalendarScope() {
  return GOOGLE_CALENDAR_SCOPE;
}

export function getGoogleOAuthConfig(requestUrl: string) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUri = new URL(
    "/api/google-calendar/callback",
    requestUrl,
  ).toString();

  return { clientId, clientSecret, redirectUri };
}

export function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

export async function exchangeGoogleCalendarCode({
  code,
  requestUrl,
}: {
  code: string;
  requestUrl: string;
}) {
  const { clientId, clientSecret, redirectUri } =
    getGoogleOAuthConfig(requestUrl);

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth is not configured");
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
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const token = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || token.error || !token.access_token) {
    throw new Error(token.error_description || "Could not connect Google Calendar");
  }

  return token;
}

export async function saveGoogleCalendarConnection({
  supabase,
  userId,
  token,
  connectedEmail,
}: {
  supabase: SupabaseClient;
  userId: string;
  token: GoogleTokenResponse;
  connectedEmail?: string | null;
}) {
  const { data: existing } = await supabase
    .from("calendar_connections")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("calendar_id", "primary")
    .maybeSingle();

  const expiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000).toISOString()
    : null;

  const { error } = await supabase.from("calendar_connections").upsert(
    {
      user_id: userId,
      provider: "google",
      calendar_id: "primary",
      access_token: token.access_token,
      refresh_token: token.refresh_token || existing?.refresh_token || null,
      expires_at: expiresAt,
      scope: token.scope || GOOGLE_CALENDAR_SCOPE,
      connected_email: connectedEmail ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider,calendar_id" },
  );

  if (error) throw error;
}

export async function hasGoogleCalendarConnection(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("calendar_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("calendar_id", "primary")
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return false;
    throw error;
  }

  return Boolean(data);
}

async function getConnection(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("calendar_id", "primary")
    .maybeSingle();

  if (error) throw error;
  return data as CalendarConnection | null;
}

async function refreshConnectionToken({
  supabase,
  connection,
  requestUrl,
}: {
  supabase: SupabaseClient;
  connection: CalendarConnection;
  requestUrl: string;
}) {
  if (!connection.refresh_token) {
    throw new ReconnectRequiredError("Missing refresh token");
  }

  const { clientId, clientSecret } = getGoogleOAuthConfig(requestUrl);
  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth is not configured");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: connection.refresh_token,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const token = (await response.json()) as GoogleTokenResponse;
  if (!response.ok || token.error || !token.access_token) {
    throw new ReconnectRequiredError("Refresh token revoked or invalid");
  }

  const expiresAt = token.expires_in
    ? new Date(Date.now() + token.expires_in * 1000).toISOString()
    : connection.expires_at;

  const { error } = await supabase
    .from("calendar_connections")
    .update({
      access_token: token.access_token,
      expires_at: expiresAt,
      scope: token.scope || connection.scope,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  if (error) throw error;

  return {
    ...connection,
    access_token: token.access_token,
    expires_at: expiresAt,
  };
}

async function getUsableConnection({
  supabase,
  userId,
  requestUrl,
}: {
  supabase: SupabaseClient;
  userId: string;
  requestUrl: string;
}) {
  const connection = await getConnection(supabase, userId);
  if (!connection) return null;

  const expiresAt = connection.expires_at
    ? new Date(connection.expires_at).getTime()
    : 0;
  const shouldRefresh = expiresAt && expiresAt < Date.now() + 60_000;

  if (!shouldRefresh) return connection;

  return refreshConnectionToken({ supabase, connection, requestUrl });
}

function googleDateToIso(date?: GoogleCalendarDate) {
  if (!date) return null;
  if (date.dateTime) return new Date(date.dateTime).toISOString();
  if (date.date) return new Date(`${date.date}T00:00:00`).toISOString();
  return null;
}

export function getSyncBounds(monthsAhead: number = 3): { timeMin: string; timeMax: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1 + monthsAhead, 0, 23, 59, 59);

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

export async function syncGoogleCalendarEvents({
  supabase,
  userId,
  requestUrl,
  timeRange,
}: {
  supabase: SupabaseClient;
  userId: string;
  requestUrl: string;
  timeRange?: { timeMin: string; timeMax: string };
}): Promise<{ synced: number }> {
  const connection = await getUsableConnection({ supabase, userId, requestUrl });
  if (!connection) {
    throw new Error("not_connected");
  }

  const { timeMin, timeMax } = timeRange || getSyncBounds();
  const url = new URL(GOOGLE_EVENTS_URL);
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${connection.access_token}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new ReconnectRequiredError("Google Calendar returned 401");
    }
    const payload = (await response.json()) as GoogleEventsResponse;
    const message = payload.error?.message || `Google Calendar API error (${response.status})`;
    throw new GoogleApiError(response.status, message);
  }

  const payload = (await response.json()) as GoogleEventsResponse;

  const rows = (payload.items || [])
    .map((event) => {
      const startsAt = googleDateToIso(event.start);
      if (!startsAt) return null;

      return {
        user_id: userId,
        title: event.summary || "Untitled event",
        starts_at: startsAt,
        ends_at: googleDateToIso(event.end),
        all_day: Boolean(event.start?.date),
        source: "google",
        external_id: event.id,
        external_calendar_id: connection.calendar_id,
        html_link: event.htmlLink || null,
        location: event.location || null,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((row): row is SyncedCalendarEventRow => row !== null);

  if (rows.length > 0) {
    const { error } = await supabase.from("calendar_events").upsert(rows, {
      onConflict: "user_id,source,external_calendar_id,external_id",
    });

    if (error) throw error;
  }

  return { synced: rows.length };
}
