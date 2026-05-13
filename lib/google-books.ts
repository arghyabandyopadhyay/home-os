export interface GoogleBookResult {
  title: string;
  author: string;
  cover_url: string;
  description: string;
  published_year: string;

  preview_url: string;
  info_url: string;

  external_id: string;
}

export async function searchGoogleBooks(
  query: string,
  retries = 3,
): Promise<GoogleBookResult | null> {
  if (!query) return null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query,
        )}&maxResults=1`,
      );

      // Handle rate limiting with exponential backoff
      if (res.status === 429) {
        if (attempt < retries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.warn(
            `Rate limited. Retrying after ${waitTime}ms (attempt ${attempt + 1}/${retries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        } else {
          console.error("Rate limited after all retries");
          throw new Error("Rate limited by Google Books API");
        }
      }

      if (!res.ok) {
        console.error(
          `Google Books API error: ${res.status} ${res.statusText}`,
        );
        return null;
      }

      const data = await res.json();

      const item = data.items?.[0];

      if (!item) {
        console.warn(`No books found for query: "${query}"`);
        return null;
      }

      const info = item.volumeInfo;

      const result = {
        title: info.title || "",
        author: info.authors?.[0] || "",
        cover_url: info.imageLinks?.thumbnail || "",
        description: info.description || "",
        published_year: info.publishedDate || "",
        preview_url: info.previewLink || "",
        info_url: info.infoLink || "",
        external_id: item.id,
      };

      console.log("Book found:", result);
      return result;
    } catch (error) {
      if (attempt === retries - 1) {
        console.error("Google Books search error:", error);
        throw error;
      }
      const waitTime = Math.pow(2, attempt) * 1000;
      console.warn(
        `Error on attempt ${attempt + 1}, retrying after ${waitTime}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  return null;
}
