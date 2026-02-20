import { useState } from 'react';
import BookSearch from './BookSearch';
import { findOrCreateBook, addToShelf, createRecSet } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { getCoverUrl } from '@/lib/openlibrary';

const SIM_TAGS = ['Plot', 'Tone', 'Themes', 'Voice', 'Characters', 'Tropes', 'Setting', 'Pacing', 'Mood', 'Structure'];

export default function CreateRecFlow({ onClose, onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: pick source, 2: review, 3: pick recs, 4: tags & note
  const [sourceBook, setSourceBook] = useState(null);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedRecs, setSelectedRecs] = useState([]); // [{olBook, tags: []}]
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectSource = (book) => {
    setSourceBook(book);
    setStep(2);
  };

  const handleSelectRec = (book) => {
    if (selectedRecs.length >= 3) return;
    if (selectedRecs.find(r => r.olBook.ol_key === book.ol_key)) return;
    setSelectedRecs([...selectedRecs, { olBook: book, tags: [] }]);
  };

  const removeRec = (i) => {
    setSelectedRecs(selectedRecs.filter((_, j) => j !== i));
  };

  const toggleTag = (recIndex, tag) => {
    const updated = [...selectedRecs];
    const tags = updated[recIndex].tags;
    if (tags.includes(tag)) {
      updated[recIndex].tags = tags.filter(t => t !== tag);
    } else {
      updated[recIndex].tags = [...tags, tag];
    }
    setSelectedRecs(updated);
  };

  const handleSubmit = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      // Save source book to DB
      const dbSource = await findOrCreateBook(sourceBook);
      // Mark as read
      await addToShelf(user.id, dbSource.id, 'read');

      // Save rec books to DB
      const recData = [];
      for (const rec of selectedRecs) {
        const dbBook = await findOrCreateBook(rec.olBook);
        recData.push({ bookId: dbBook.id, tags: rec.tags });
        // Also add rec'd book to recommender's library as Read
        await addToShelf(user.id, dbBook.id, 'read');
      }

      // Create the rec set
      await createRecSet(user.id, dbSource.id, review, rating, note, recData);
      onComplete && onComplete();
      onClose();
    } catch (e) {
      console.error('Error creating rec set:', e);
      alert('Something went wrong. Please try again.');
    }
    setSaving(false);
  };

  const coverUrl = (book) => book?.cover_id ? getCoverUrl(book.cover_id, 'S') : null;

  return (
    <div className="overlay" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="header">
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>←</button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {step === 1 && 'What did you read?'}
          {step === 2 && 'Your thoughts'}
          {step === 3 && 'Pick 3 recs'}
          {step === 4 && 'Add details'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{step}/4</div>
      </div>

      <div className="scroll-area" style={{ padding: '16px 20px', flex: 1 }}>
        {/* Step 1: Select source book */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Search for the book you finished. This is the book your 3 recs will be based on.
            </p>
            <BookSearch onSelect={handleSelectSource} autoFocus placeholder="Search by title or author..." />
          </div>
        )}

        {/* Step 2: Review & rating */}
        {step === 2 && sourceBook && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--card)', borderRadius: 12, marginBottom: 20 }}>
              {coverUrl(sourceBook) ? (
                <img src={coverUrl(sourceBook)} alt="" style={{ width: 44, height: 64, borderRadius: 6, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 64, borderRadius: 6, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📖</div>
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{sourceBook.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sourceBook.author}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Rating</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: s <= rating ? 'var(--gold)' : 'var(--border)' }}>★</button>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Short review (optional)</div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think? What made it special?"
              maxLength={500}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 100, outline: 'none' }}
            />
            <div style={{ fontSize: 10, color: 'var(--text-light)', textAlign: 'right', marginTop: 4 }}>{review.length}/500</div>

            <button
              className="btn-primary"
              onClick={() => setStep(3)}
              disabled={rating === 0}
              style={{ marginTop: 16 }}
            >
              Next: Pick 3 Recs
            </button>
          </div>
        )}

        {/* Step 3: Pick 3 recommended books */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
              If someone loved <strong style={{ color: 'var(--text)' }}>{sourceBook?.title}</strong>, what 3 books would you recommend?
            </p>

            {/* Selected recs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[0, 1, 2].map(i => {
                const rec = selectedRecs[i];
                return (
                  <div key={i} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px dashed ${rec ? 'var(--accent)' : 'var(--border)'}`, background: rec ? 'var(--accent-light)' : 'var(--card)', textAlign: 'center', minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {rec ? (
                      <>
                        <button onClick={() => removeRec(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{rec.olBook.title}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{rec.olBook.author}</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 20, color: 'var(--border)' }}>+</div>
                        <div style={{ fontSize: 9, color: 'var(--text-light)' }}>Rec {i + 1}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedRecs.length < 3 && (
              <BookSearch onSelect={handleSelectRec} placeholder="Search for rec book..." />
            )}

            {selectedRecs.length === 3 && (
              <button className="btn-primary" onClick={() => setStep(4)} style={{ marginTop: 16 }}>
                Next: Add Tags & Note
              </button>
            )}
          </div>
        )}

        {/* Step 4: Tags and note */}
        {step === 4 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Why do these books connect? Add similarity tags and a note.
            </p>

            {selectedRecs.map((rec, i) => (
              <div key={i} style={{ padding: 14, background: 'var(--card)', borderRadius: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{rec.olBook.title}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {SIM_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(i, tag)}
                      style={{
                        fontSize: 10,
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: rec.tags.includes(tag) ? 'none' : '1px solid var(--border)',
                        background: rec.tags.includes(tag) ? 'var(--accent)' : 'var(--card)',
                        color: rec.tags.includes(tag) ? '#fff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 }}>Rec note (optional)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What ties these 3 books together?"
              maxLength={300}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 14, fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 80, outline: 'none' }}
            />
            <div style={{ fontSize: 10, color: 'var(--text-light)', textAlign: 'right', marginTop: 4 }}>{note.length}/300</div>

            <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ marginTop: 16 }}>
              {saving ? 'Posting...' : 'Post Your 3 Recs'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
