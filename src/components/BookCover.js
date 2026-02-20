import { getCoverUrl } from '@/lib/openlibrary';

export default function BookCover({ book, size = 'md', coverId }) {
  const cId = coverId || book?.cover_id;
  const sizeClass = `book-cover-${size}`;
  const imgSize = size === 'sm' ? 'S' : size === 'lg' ? 'L' : 'M';
  const url = cId ? getCoverUrl(cId, imgSize) : null;

  // Try ISBN-based cover if no cover_id but ISBN exists
  const isbnUrl = !url && book?.isbn
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-${imgSize}.jpg`
    : null;

  const finalUrl = url || isbnUrl;

  if (!finalUrl) {
    return (
      <div className={`book-cover-placeholder ${sizeClass}`}>
        {book?.cover_emoji || '📖'}
      </div>
    );
  }

  return (
    <img
      src={finalUrl}
      alt={book?.title || 'Book cover'}
      className={`book-cover ${sizeClass}`}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  );
}
