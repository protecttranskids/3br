import { useState, useEffect, useRef } from 'react';
import { searchBooks, getCoverUrl } from '@/lib/openlibrary';

export default function BookSearch({ onSelect, placeholder = 'Search for a book...', autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const books = await searchBooks(query);
        setResults(books);
      } catch (e) {
        console.error('Search error:', e);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-light)' }}>🔍</span>
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 8, maxHeight: 360, overflowY: 'auto', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }}>
          {results.map((book, i) => (
            <button
              key={book.ol_key || i}
              onClick={() => { onSelect(book); setQuery(''); setResults([]); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'none',
                border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {book.cover_id ? (
                <img
                  src={getCoverUrl(book.cover_id, 'S')}
                  alt=""
                  style={{ width: 40, height: 58, borderRadius: 4, objectFit: 'cover', background: 'var(--border)' }}
                />
              ) : (
                <div style={{ width: 40, height: 58, borderRadius: 4, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📖</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{book.author}</div>
                <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
                  {book.year && `${book.year}`}
                  {book.pages && ` · ${book.pages} pages`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No books found for "{query}"
        </div>
      )}
    </div>
  );
}
