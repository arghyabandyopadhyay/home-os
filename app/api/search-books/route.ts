import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[];
}

interface GoogleBooksResponse {
  items?: {
    volumeInfo?: {
      description?: string;
      previewLink?: string;
      infoLink?: string;
    };
  }[];
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

const cache = new Map<string, { data: BookResult | null; timestamp: number }>();

const CACHE_TTL = 1000 * 60 * 60;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const cached = cache.get(query);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      data: cached.data,
    });
  }

  try {
    // Open Library search
    const openLibraryUrl = new URL("https://openlibrary.org/search.json");

    openLibraryUrl.searchParams.set("title", query);

    openLibraryUrl.searchParams.set("limit", "1");

    const openLibraryRes = await fetch(openLibraryUrl.toString(), {
      next: { revalidate: 3600 },
    });

    if (!openLibraryRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch books" },
        { status: openLibraryRes.status },
      );
    }

    const openLibraryData =
      (await openLibraryRes.json()) as OpenLibraryResponse;

    const book = openLibraryData.docs?.[0];

    if (!book) {
      cache.set(query, {
        data: null,
        timestamp: Date.now(),
      });

      return NextResponse.json({
        data: null,
      });
    }

    // Google Books metadata fetch (NO API KEY)
    let description = "";
    let preview_url = "";
    let info_url = "";

    try {
      const googleRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query,
        )}&maxResults=1&key=${process.env.GOOGLE_BOOKS_API_KEY || ""}`,
      );

      if (googleRes.ok) {
        const googleData = (await googleRes.json()) as GoogleBooksResponse;

        const googleBook = googleData.items?.[0]?.volumeInfo;

        description = googleBook?.description || "";

        preview_url = googleBook?.previewLink || "";

        info_url = googleBook?.infoLink || "";
      }
    } catch (err) {
      console.error("Google Books metadata fetch failed:", err);
    }

    const result: BookResult = {
      title: book.title || "",
      author: book.author_name?.[0] || "Unknown",
      cover_url: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : "",
      description,
      published_year: book.first_publish_year
        ? String(book.first_publish_year)
        : "",
      preview_url,
      info_url:
        info_url || (book.key ? `https://openlibrary.org${book.key}` : ""),
      external_id: book.key || "",
    };

    cache.set(query, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error("Book search error:", error);

    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 },
    );
  }
}
