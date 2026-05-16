export type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  source: string;
  external_id: string | null;
  external_calendar_id: string | null;
  html_link: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};
