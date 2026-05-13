export interface Book {
  id: string;

  title: string;

  author: string | null;

  cover_url: string | null;

  status: string;

  rating: number;

  notes: string | null;

  progress: number;

  isbn: string | null;

  published_year: string | null;

  description: string | null;

  created_at: string;
  source: string | null;
  external_id: string | null;
  preview_url: string | null;
  info_url: string | null;
  epub_url: string | null;
  pdf_url: string | null;
  file_path: string | null;
  file_type: string | null;
}
