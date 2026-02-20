import { useState } from 'react';
import BookSearch from './BookSearch';
import { findOrCreateBook, addToShelf } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { getCoverUrl } from '@/lib/openlibrary';

const GENRES = [
  { label: 'Fantasy', emoji: '🐉' },
  { label: 'Sci-Fi', emoji: '🚀' },
  { label: 'Literary Fiction', emoji: '📖' },
  { label: 'Mystery', emoji: '🔍' },
  { label: 'Romance', emoji: '💕' },
  { label: 'Horror', emoji: '👻' },
  { label: 'Memoir', emoji: '📝' },
  { label: 'History', emoji: '🏛️' },
  { label: 'Thriller', emoji: '🔪' },
  { label: 'Contemporary', emoji: '🌆' },
  { label: 'Young Adult', emoji: '✨' },
  { label: 'Non-Fiction', emoji: '🧠' },
];

export default function Onboarding({ onComplete }) {
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState(1); // 1: welcome, 2: genres, 3: add books, 4: done
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [addedBooks, setAddedBooks] = useState([]); // [{olBook, dbBook, shelf}]
  const [saving, setSaving] = useState(false);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleAddBook = async (olBook, shelf) => {
    if (!user) return;
    try {
      const dbBook = await findOrCreateBook(olBook);
      await addToShelf(user.id, dbBook.id, shelf);
      setAddedBooks(prev => [...prev, { olBook, dbBook, shelf }]);
    } catch (e) {
      console.error('Error adding book:', e);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    onComplete();
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 52, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)', marginBottom: 8 }}>3BR</div>
          <div style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.5 }}>
            Every book you finish unlocks exactly <strong style={{ color: 'var(--text)' }}>3 recommendations</strong>.
          </div>

          <div style={{ width: '100%', maxWidth: 320, textAlign: 'left', marginBottom: 32 }}>
            {[
              { icon: '📖', text: 'Mark a book as Read' },
              { icon: '⭐', text: 'Share your 3 best recommendations' },
              { icon: '🔍', text: 'Discover what others recommend' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{item.text}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 32, maxWidth: 300 }}>
            The constraint is the point. When you can only pick 3, every recommendation matters.
          </div>

          <button className="btn-primary" onClick={() => setStep(2)} style={{ maxWidth: 320 }}>
            Get Started
          </button>
        </div>
      )}

      {/* Step 2: Pick genres */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>STEP 1 OF 2</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>What do you read?</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>Pick a few genres so we can help you find your people.</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {GENRES.map(g => (
              <button
                key={g.label}
                onClick={() => toggleGenre(g.label)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: selectedGenres.includes(g.label) ? 'none' : '1px solid var(--border)',
                  background: selectedGenres.includes(g.label) ? 'var(--accent)' : 'var(--card)',
                  color: selectedGenres.includes(g.label) ? '#fff' : 'var(--text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button
              className="btn-primary"
              onClick={() => setStep(3)}
              disabled={selectedGenres.length === 0}
            >
              {selectedGenres.length === 0 ? 'Pick at least one' : `Continue with ${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''}`}
            </button>
            <button
              onClick={() => setStep(3)}
              style={{ width: '100%', padding: 12, marginTop: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Add some books */}
      {step === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>STEP 2 OF 2</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Add a few books</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Search for books you've read. Adding at least one as "Read" lets you create your first rec set.
          </div>

          <BookSearch
            onSelect={(book) => handleAddBook(book, 'read')}
            placeholder="Search by title or author..."
          />

          {/* Added books */}
          {addedBooks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Added ({addedBooks.length})
              </div>
              {addedBooks.map((item, i) => {
                const coverUrl = item.olBook.cover_id ? getCoverUrl(item.olBook.cover_id, 'S') : null;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--card)', borderRadius: 10, marginBottom: 6 }}>
                    {coverUrl ? (
                      <img src={coverUrl} alt="" style={{ width: 36, height: 52, borderRadius: 4, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 36, height: 52, borderRadius: 4, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📖</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.olBook.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.olBook.author}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: 'rgba(52,211,153,0.15)', color: 'var(--green)' }}>
                      ✓ Read
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              className="btn-primary"
              onClick={handleFinish}
              disabled={saving}
            >
              {addedBooks.length === 0 ? 'Skip & Explore' : saving ? 'Setting up...' : addedBooks.length >= 1 ? "I'm ready — let's go!" : `Add ${1 - addedBooks.length} more`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
