// Open Library API helper
// Searches for books and returns normalized results

export async function searchBooks(query) {
  if (!query || query.length < 2) return [];
  
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=key,title,author_name,first_publish_year,isbn,number_of_pages_median,subject,cover_i,edition_count`
  );
  const data = await res.json();
  
  return (data.docs || []).map(doc => ({
    ol_key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] || 'Unknown',
    year: doc.first_publish_year,
    isbn: doc.isbn?.[0] || null,
    pages: doc.number_of_pages_median || null,
    cover_id: doc.cover_i || null,
    subjects: (doc.subject || []).slice(0, 6),
    editions: doc.edition_count || 0,
  }));
}

export function getCoverUrl(coverId, size = 'M') {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function getBookDetails(olKey) {
  const res = await fetch(`https://openlibrary.org${olKey}.json`);
  const data = await res.json();
  
  let description = '';
  if (typeof data.description === 'string') {
    description = data.description;
  } else if (data.description?.value) {
    description = data.description.value;
  }
  
  return {
    description,
    subjects: (data.subjects || []).slice(0, 12),
  };
}
