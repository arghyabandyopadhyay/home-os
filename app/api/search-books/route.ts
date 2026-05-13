import { NextRequest, NextResponse } from "next/server";

interface GoogleBookInfo {
  title?: string;
  authors?: string[];
  imageLinks?: {
    thumbnail?: string;
  };
  description?: string;
  publishedDate?: string;
  previewLink?: string;
  infoLink?: string;
  language?: string;
}

interface GoogleBookItem {
  id?: string;
  volumeInfo?: GoogleBookInfo;
}

interface GoogleBooksResponse {
  items?: GoogleBookItem[];
}

interface BookResult {
  title: string;
  author: string;
  cover_url: string;
  description: string;
  published_year: string;
  preview_url: string;
  info_url: string;
  external_id: string;
}

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY; // Optional: Use if you have an API key for higher rate limits
// Simple in-memory cache with TTL (1 hour)
const cache = new Map<string, { data: BookResult | null; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(query);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ data: cached.data });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query,
      )}&langRestrict=en&maxResults=1&key=${API_KEY}`,
    );

    if (res.status === 429) {
      return NextResponse.json(
        { error: "Rate limited. Please try again later." },
        { status: 429 },
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `API error: ${res.statusText}` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as GoogleBooksResponse;
    const item = data.items?.find((book: GoogleBookItem) => {
      const info = book.volumeInfo;
      return (
        info?.language === "en" &&
        info.title?.toLowerCase().includes(query.toLowerCase())
      );
    });

    if (!item || !item.volumeInfo || !item.id) {
      cache.set(query, { data: null, timestamp: Date.now() });
      return NextResponse.json({ data: null });
    }

    const info = item.volumeInfo;
    const result: BookResult = {
      title: info.title || "",
      author: info.authors?.[0] || "",
      cover_url: info.imageLinks?.thumbnail || "",
      description: info.description || "",
      published_year: info.publishedDate || "",
      preview_url: info.previewLink || "",
      info_url: info.infoLink || "",
      external_id: item.id,
    };

    // Cache the result
    cache.set(query, { data: result, timestamp: Date.now() });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Book search error:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 },
    );
  }
}
