/**
 * Pure utility functions for Google Contacts field mapping.
 * Separated from google-contacts.ts to avoid Supabase/fetch dependencies in tests.
 */

export type GooglePersonName = {
  displayName?: string;
  givenName?: string;
  familyName?: string;
};

export type GooglePersonEmail = {
  value?: string;
};

export type GooglePersonPhone = {
  value?: string;
};

export type GooglePersonOrganization = {
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
