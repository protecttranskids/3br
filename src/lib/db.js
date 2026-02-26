import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getFeed, getExploreFeed, getActivities, getUserShelves, getUserRecSets, getProfile, addToShelf, removeFromShelf, findOrCreateBook } from '@/lib/db';
import { searchBooks, getCoverUrl } from '@/lib/openlibrary';
import AuthScreen from '@/components/AuthScreen';
import BookSearch from '@/components/BookSearch';
import RecSetCard from '@/components/RecSetCard';
import CreateRecFlow from '@/components/CreateRecFlow';
import Onboarding from '@/components/Onboarding';

// Tab icons as simple SVGs
function IconHome({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--accent)' : 'none'} stroke={active ? 'var(--accent)' : 'var(--text-light)'} strokeWidth="2"><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10"/></svg>;
}
function IconSearch({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--text-light)'} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
}
function IconBook({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--accent)' : 'none'} stroke={active ? 'var(--accent)' : 'var(--text-light)'} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
}
function IconUser({ active }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--accent)' : 'none'} stroke={active ? 'var(--accent)' : 'var(--text-light)'} strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

function FeedTab({ onBookTap, onUserTap }) {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    const [recSets, acts] = await Promise.all([
      getExploreFeed(50),
      getActivities(30),
    ]);
    setFeed(recSets || []);
    setActivities(acts || []);
    setLoading(false);
  };

  useEffect(() => { loadFeed(); }, [user]);

  const merged = [
    ...feed.map(r => ({ ...r, _type: 'rec_set', _time: new Date(r.created_at).getTime() })),
    ...activities.map(a => ({ ...a, _type: 'activity', _time: new Date(a.created_at).getTime() })),
  ].sort((a, b) => b._time - a._time);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const shelfLabel = (shelf) => {
    if (shelf === 'read') return 'finished reading';
    if (shelf === 'reading') return 'started reading';
    if (shelf === 'tbr') return 'wants to read';
    return 'shelved';
  };

  return (
    <div>
      <div className="header">
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>3BR</div>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: 8 }}>BETA</span>
      </div>
      <div className="scroll-area" style={{ paddingTop: 12 }}>
        {/* Welcome card */}
        <div style={{ margin: '0 16px 16px', padding: 20, borderRadius: 16, background: 'linear-gradient(135deg, #6C63FF, #8B83FF)', color: '#fff' }}>
          <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Welcome to 3BR</div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 12 }}>
            Every book you finish unlocks exactly 3 recommendations. Not 5, not 10 — just 3. The constraint forces you to think about what truly connects.
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, lineHeight: 1.5 }}>
            <strong>How it works:</strong> Mark a book as Read → Create a Rec Set with your 3 picks → Discover what others recommend.
          </div>
        </div>

        {/* Bookstore coming soon card */}
        <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'var(--card)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3D3B8E, #5A58B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Indie Bookstore Integration</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 2 }}>Coming soon — buy books through 3BR and support your local indie bookstore via Bookshop.org.</div>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--gold)', background: 'rgba(251,191,36,0.15)', padding: '3px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>SOON</span>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && merged.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>No activity yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
              Be the first! Tap the + button to mark a book as read and share your 3 recommendations.
            </p>
          </div>
        )}

        {merged.map(item => {
          if (item._type === 'rec_set') {
            return <RecSetCard key={String('rs-' + item.id)} recSet={item} onBookTap={onBookTap} onUserTap={onUserTap} />;
          }

          const profile = item.profiles;
          const book = item.books;

          if (!profile || typeof profile !== 'object' || !profile.display_name) return null;

          if (item.type === 'joined') {
            return (
              <div key={String('act-' + item.id)} className="card" style={{ margin: '0 16px 12px', padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{'👋'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <strong>{String(profile.display_name)}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{' joined 3BR'}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>{timeAgo(item.created_at)}</div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', background: 'rgba(52,211,153,0.15)', padding: '3px 8px', borderRadius: 6 }}>NEW</span>
              </div>
            );
          }

          if (!book || typeof book !== 'object' || !book.title) return null;

          const coverUrl = book.isbn
            ? 'https://covers.openlibrary.org/b/isbn/' + book.isbn + '-S.jpg'
            : null;

          return (
            <div key={String('act-' + item.id)} className="card" style={{ margin: '0 16px 12px', padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                {String(profile.display_name)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                  <strong>{String(profile.display_name)}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{' ' + shelfLabel(item.shelf) + ' '}</span>
                </div>
                <div
                  onClick={() => onBookTap && onBookTap(book)}
                  style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--accent)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {String(book.title)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>{timeAgo(item.created_at)}</div>
              </div>
              {coverUrl ? (
                <img onClick={() => onBookTap && onBookTap(book)} src={coverUrl} alt="" style={{ width: 36, height: 52, borderRadius: 4, objectFit: 'cover', background: 'var(--border)', cursor: 'pointer', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 52, borderRadius: 4, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{'📖'}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExploreTab({ onBookTap }) {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExploreFeed(50).then(data => { setFeed(data); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="header">
        <div style={{ fontSize: 16, fontWeight: 700 }}>Explore</div>
      </div>
      <div className="scroll-area" style={{ padding: '12px 0' }}>
        <div style={{ padding: '0 16px 16px' }}>
          <BookSearch
            onSelect={async (book) => {
              if (!user) return;
              const dbBook = await findOrCreateBook(book);
              onBookTap && onBookTap(dbBook);
            }}
            placeholder="Search any book..."
          />
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          feed.map(recSet => (
            <RecSetCard key={recSet.id} recSet={recSet} onBookTap={onBookTap} />
          ))
        )}
      </div>
    </div>
  );
}

function LibraryTab({ onBookTap }) {
  const { user } = useAuth();
  const [shelves, setShelves] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadShelves = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserShelves(user.id);
    setShelves(data);
    setLoading(false);
  };

  useEffect(() => { loadShelves(); }, [user]);

  const filtered = filter === 'all' ? shelves : shelves.filter(s => s.shelf === filter);
  const counts = {
    all: shelves.length,
    reading: shelves.filter(s => s.shelf === 'reading').length,
    tbr: shelves.filter(s => s.shelf === 'tbr').length,
    read: shelves.filter(s => s.shelf === 'read').length,
  };

  return (
    <div>
      <div className="header">
        <div style={{ fontSize: 16, fontWeight: 700 }}>Library</div>
      </div>
      <div className="scroll-area">
        {/* Filter tabs */}
        <div style={{ display: 'flex', padding: '12px 16px', gap: 6, overflowX: 'auto' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'reading', label: '📖 Reading' },
            { key: 'tbr', label: '📋 TBR' },
            { key: 'read', label: '✓ Read' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: filter === f.key ? 'none' : '1px solid var(--border)',
                background: filter === f.key ? 'var(--accent)' : 'var(--card)',
                color: filter === f.key ? '#fff' : 'var(--text)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-body)',
              }}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {/* Add book */}
        <div style={{ padding: '0 16px 12px' }}>
          <BookSearch
            onSelect={async (book) => {
              if (!user) return;
              const dbBook = await findOrCreateBook(book);
              await addToShelf(user.id, dbBook.id, 'tbr');
              loadShelves();
            }}
            placeholder="Add a book to your library..."
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No books here yet. Search above to add some!</p>
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            {filtered.map(item => {
              const book = item.books;
              const coverUrl = book?.isbn
                ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg`
                : null;
              return (
                <div
                  key={item.id}
                  onClick={() => onBookTap && onBookTap(book)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'var(--card)', borderRadius: 12, marginBottom: 8, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                >
                  {coverUrl ? (
                    <img src={coverUrl} alt="" style={{ width: 44, height: 64, borderRadius: 6, objectFit: 'cover', background: 'var(--border)' }} />
                  ) : (
                    <div style={{ width: 44, height: 64, borderRadius: 6, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📖</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book?.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{book?.author}</div>
                  </div>
                  <span style={{
                    fontSize: 9,
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontWeight: 600,
                    background: item.shelf === 'read' ? 'rgba(52,211,153,0.15)' : item.shelf === 'reading' ? 'rgba(251,191,36,0.15)' : 'var(--accent-light)',
                    color: item.shelf === 'read' ? 'var(--green)' : item.shelf === 'reading' ? 'var(--gold)' : 'var(--accent)',
                  }}>
                    {item.shelf === 'read' ? 'Read' : item.shelf === 'reading' ? 'Reading' : 'TBR'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, profile, signOut } = useAuth();
  const [recSets, setRecSets] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserRecSets(user.id), getUserShelves(user.id)]).then(([rs, sh]) => {
      setRecSets(rs);
      setShelves(sh);
      setLoading(false);
    });
  }, [user]);

  const readCount = shelves.filter(s => s.shelf === 'read').length;
  const recCount = recSets.length;
  const recsUnlocked = readCount * 3;

  return (
    <div>
      <div className="header">
        <div style={{ fontSize: 16, fontWeight: 700 }}>Profile</div>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Sign Out</button>
      </div>
      <div className="scroll-area" style={{ padding: '20px 16px' }}>
        {/* Profile header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--accent)', color: '#fff', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            {profile?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{profile?.display_name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{profile?.handle}</div>
        </div>

        {/* Stats */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', textAlign: 'center' }}>
            {[
              { label: 'Books Read', value: readCount },
              { label: 'Rec Sets', value: recCount },
              { label: 'Recs Unlocked', value: recsUnlocked },
            ].map(s => (
              <div key={s.label} style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent rec sets */}
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Your Rec Sets</div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><div className="spinner" /></div>
        ) : recSets.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⭐</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>You haven't created any rec sets yet. Finish a book to unlock your 3 recs!</p>
          </div>
        ) : (
          recSets.map(rs => (
            <div key={rs.id} className="card" style={{ padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 64, borderRadius: 6, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {rs.source_book?.cover_emoji || '📖'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{rs.source_book?.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  → {rs.recs?.map(r => r.books?.title).filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Bookstore coming soon */}
        <div className="card" style={{ padding: 16, marginBottom: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3D3B8E, #5A58B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📚</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>My Home Bookstore</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 2 }}>Coming soon — link your favorite indie bookstore. When you buy through 3BR, a portion of every sale supports your store via Bookshop.org.</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🏪</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>We believe in supporting indie bookstores. This feature will let you pick one (or more!) local stores to support with every purchase.</div>
            </div>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--gold)', background: 'rgba(251,191,36,0.15)', padding: '3px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>SOON</span>
          </div>
        </div>

        {/* Beta feedback */}
        <div className="card" style={{ padding: 16, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Beta Feedback</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>We'd love to hear your thoughts. What's working? What's missing? Would you use this?</div>
          <a href="https://forms.gle/REPLACE_WITH_YOUR_FORM_LINK" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px', borderRadius: 12, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Share Feedback</a>
        </div>
      </div>
    </div>
  );
}
function BookDetail({ book, onClose, onGoToLibrary }) {
  const { user } = useAuth();
  const [shelf, setShelf] = useState(null);
  const [pendingShelf, setPendingShelf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !book) return;
    getUserShelves(user.id).then(data => {
      const entry = data.find(s => s.book_id === book.id);
      if (entry) { setShelf(entry.shelf); setPendingShelf(entry.shelf); setSaved(true); }
    });
  }, [user, book]);

  const handleSave = async () => {
    if (!user || !pendingShelf) return;
    setLoading(true);
    try {
      if (pendingShelf === shelf) {
        await removeFromShelf(user.id, book.id);
        setShelf(null);
        setPendingShelf(null);
        setSaved(false);
      } else {
        await addToShelf(user.id, book.id, pendingShelf);
        setShelf(pendingShelf);
        setSaved(true);
      }
    } catch (e) {
      console.error('Shelf error:', e);
    }
    setLoading(false);
  };

  const coverUrl = book?.isbn
    ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`
    : null;

  if (!book) return null;

  return (
    <div className="overlay" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="header">
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>←</button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Book Details</div>
        <div style={{ width: 22 }} />
      </div>
      <div className="scroll-area" style={{ padding: '20px', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          {coverUrl ? (
            <img src={coverUrl} alt="" style={{ width: 120, height: 174, borderRadius: 8, objectFit: 'cover', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
          ) : (
            <div style={{ width: 120, height: 174, borderRadius: 8, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto' }}>📖</div>
          )}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.2, marginBottom: 4 }}>{book.title}</div>
          <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600 }}>{book.author}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {book.pages && `${book.pages} pages`}
            {book.pub_date && ` · ${book.pub_date}`}
            {book.publisher && ` · ${book.publisher}`}
          </div>
        </div>

        {/* Shelf buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[
            { key: 'tbr', label: '📋 TBR', color: 'var(--accent)' },
            { key: 'reading', label: '📖 Reading', color: 'var(--gold)' },
            { key: 'read', label: '✓ Read', color: 'var(--green)' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setPendingShelf(s.key)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: 12,
                border: pendingShelf === s.key ? 'none' : '1px solid var(--border)',
                background: pendingShelf === s.key ? s.color : 'var(--card)',
                color: pendingShelf === s.key ? '#fff' : 'var(--text)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Add to library button / confirmation */}
        {!saved && pendingShelf && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
            style={{ marginBottom: 20 }}
          >
            {loading ? 'Saving...' : 'Add to My Library'}
          </button>
        )}
        {saved && (
          <div style={{ marginBottom: 20, animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>Added to your library!</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                {book.title} is now on your {shelf === 'tbr' ? 'TBR' : shelf === 'reading' ? 'Reading' : 'Read'} shelf.
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button onClick={onGoToLibrary} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Go to My Library
                </button>
                <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Back to Feed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {book.summary && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>About</div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>{book.summary}</p>
          </div>
        )}

        {/* Subjects */}
        {book.subjects?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {book.subjects.slice(0, 8).map(s => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- MAIN PAGE ----
export default function Home() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('home');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showCreateRec, setShowCreateRec] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [onboarded, setOnboarded] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check if user has any shelved books (if so, skip onboarding)
  useEffect(() => {
    if (!user) { setCheckingOnboarding(false); return; }
    getUserShelves(user.id).then(data => {
      if (data && data.length > 0) setOnboarded(true);
      setCheckingOnboarding(false);
    });
  }, [user]);

  if (loading || checkingOnboarding) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  if (!onboarded) return <Onboarding onComplete={() => setOnboarded(true)} />;

  const handleBookTap = (book) => {
    if (book) setSelectedBook(book);
  };

  const [selectedUserId, setSelectedUserId] = useState(null);
  const handleUserTap = (userId) => {
    if (userId && userId !== user.id) setSelectedUserId(userId);
    else if (userId === user.id) setTab('profile');
  };

  return (
    <>
      {/* Tab content */}
      {tab === 'home' && <FeedTab key={feedKey} onBookTap={handleBookTap} onUserTap={handleUserTap} />}
      {tab === 'search' && <ExploreTab onBookTap={handleBookTap} />}
      {tab === 'library' && <LibraryTab onBookTap={handleBookTap} />}
      {tab === 'profile' && <ProfileTab />}

      {/* FAB */}
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: 'fixed', inset: 0, maxWidth: 430, margin: '0 auto', background: 'rgba(0,0,0,0.3)', zIndex: 14 }} />}
      {fabOpen && (
        <div style={{ position: 'fixed', bottom: 140, right: 'calc(50% - 195px)', zIndex: 16, display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeIn 0.15s ease' }}>
          {[
            { label: 'Create a Rec Set', icon: '⭐', action: () => { setFabOpen(false); setShowCreateRec(true); } },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, border: 'none', background: 'var(--card)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <button className="fab" onClick={() => setFabOpen(!fabOpen)}>+</button>

      {/* Tab bar */}
      <div className="tab-bar">
        {[
          { key: 'home', label: 'Feed', Icon: IconHome },
          { key: 'search', label: 'Explore', Icon: IconSearch },
          { key: 'library', label: 'Library', Icon: IconBook },
          { key: 'profile', label: 'Profile', Icon: IconUser },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`tab-item ${tab === key ? 'active' : ''}`}
          >
            <Icon active={tab === key} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Overlays */}
      {selectedBook && <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} onGoToLibrary={() => { setSelectedBook(null); setTab('library'); }} />}
      {showCreateRec && <CreateRecFlow onClose={() => setShowCreateRec(false)} onComplete={() => setFeedKey(k => k + 1)} />}
      {selectedUserId && <UserProfile userId={selectedUserId} onClose={() => setSelectedUserId(null)} onBookTap={handleBookTap} />}
    </>
  );
}


function UserProfile({ userId, onClose, onBookTap }) {
  const [profile, setProfile] = useState(null);
  const [recSets, setRecSets] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [p, rs, sh] = await Promise.all([
        getProfile(userId),
        getUserRecSets(userId),
        getUserShelves(userId),
      ]);
      setProfile(p);
      setRecSets(rs || []);
      setShelves(sh || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading || !profile) {
    return (
      <div className="overlay" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="header">
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>{'←'}</button>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{'Profile'}</div>
          <div style={{ width: 22 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
      </div>
    );
  }

  const readCount = shelves.filter(s => s.shelf === 'read').length;

  return (
    <div className="overlay" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="header">
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>{'←'}</button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{'Profile'}</div>
        <div style={{ width: 22 }} />
      </div>
      <div className="scroll-area" style={{ padding: 20, flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: 'var(--accent)', color: '#fff', fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            {String(profile.display_name || '?')[0].toUpperCase()}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{String(profile.display_name || '')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{'@' + String(profile.handle || '')}</div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', textAlign: 'center' }}>
            {[
              { label: 'Books Read', value: readCount },
              { label: 'Rec Sets', value: recSets.length },
              { label: 'Recs Given', value: recSets.length * 3 },
            ].map(s => (
              <div key={s.label} style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>{String(s.value)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>{'Rec Sets'}</div>
        {recSets.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{'No rec sets yet.'}</p>
          </div>
        ) : (
          recSets.map(rs => {
            const src = rs.source_book;
            const coverUrl = src && src.isbn ? 'https://covers.openlibrary.org/b/isbn/' + src.isbn + '-S.jpg' : null;
            return (
              <div key={rs.id} className="card" style={{ padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div onClick={() => onBookTap && onBookTap(src)} style={{ flexShrink: 0, cursor: 'pointer' }}>
                  {coverUrl ? (
                    <img src={coverUrl} alt="" style={{ width: 44, height: 64, borderRadius: 6, objectFit: 'cover', background: 'var(--border)' }} />
                  ) : (
                    <div style={{ width: 44, height: 64, borderRadius: 6, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{'📖'}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{String(src && src.title ? src.title : 'Unknown')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {'→ ' + (rs.recs || []).map(function(r) { return r.books && r.books.title ? r.books.title : ''; }).filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {shelves.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 20 }}>{'Library (' + shelves.length + ')'}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {shelves.slice(0, 12).map(s => {
                var bk = s.books;
                var cv = bk && bk.isbn ? 'https://covers.openlibrary.org/b/isbn/' + bk.isbn + '-S.jpg' : null;
                return (
                  <div key={s.id} onClick={() => onBookTap && onBookTap(bk)} style={{ cursor: 'pointer' }}>
                    {cv ? (
                      <img src={cv} alt="" style={{ width: 56, height: 82, borderRadius: 6, objectFit: 'cover', background: 'var(--border)' }} />
                    ) : (
                      <div style={{ width: 56, height: 82, borderRadius: 6, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{'📖'}</div>
                    )}
                  </div>
                );
              })}
            </div>
            {shelves.length > 12 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{'+ ' + (shelves.length - 12) + ' more books'}</div>}
          </>
        )}
      </div>
    </div>
  );
}
