import { useState } from 'react';
import { getCoverUrl } from '@/lib/openlibrary';
import { toggleLike } from '@/lib/db';
import { useAuth } from '@/lib/auth';

export default function RecSetCard({ recSet, onBookTap, onUserTap }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const profile = recSet.profiles;
  const sourceBook = recSet.source_book;
  const recs = (recSet.recs || []).sort((a, b) => a.position - b.position);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;
    const nowLiked = await toggleLike(user.id, recSet.id);
    setLiked(nowLiked);
    setLikeCount(c => nowLiked ? c + 1 : c - 1);
  };

  const coverUrl = sourceBook?.isbn
    ? `https://covers.openlibrary.org/b/isbn/${sourceBook.isbn}-M.jpg`
    : null;

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="card" style={{ margin: '0 16px 16px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            onClick={() => onUserTap && onUserTap(profile?.id)}
            style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}
          >
            {profile?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div onClick={() => onUserTap && onUserTap(profile?.id)} style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{profile?.display_name || 'Unknown'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(recSet.created_at)} · finished reading</div>
          </div>
          {recSet.rating && (
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(s => (
                <span key={s} style={{ fontSize: 12, color: s <= recSet.rating ? 'var(--gold)' : 'var(--border)' }}>★</span>
              ))}
            </div>
          )}
        </div>

        {/* Source book */}
        <div
          onClick={() => onBookTap && onBookTap(sourceBook)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg)', borderRadius: 12, marginBottom: 12, cursor: 'pointer' }}
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" style={{ width: 44, height: 64, borderRadius: 6, objectFit: 'cover', background: 'var(--border)' }} />
          ) : (
            <div style={{ width: 44, height: 64, borderRadius: 6, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📖</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{sourceBook?.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sourceBook?.author}</div>
            {recSet.review && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {recSet.review}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid var(--border)' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {expanded ? 'Hide' : 'Show'} 3 Recs
          </span>
          <span style={{ fontSize: 10, color: 'var(--accent)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
        </button>
      </div>

      {/* Recs */}
      <div style={{ maxHeight: expanded ? 500 : 0, overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
        <div style={{ padding: '4px 20px 8px' }}>
          {recSet.note && <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted)', margin: '0 0 10px', fontStyle: 'italic' }}>{recSet.note}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recs.map((rec) => {
              const recBook = rec.books;
              const recCover = recBook?.isbn
                ? `https://covers.openlibrary.org/b/isbn/${recBook.isbn}-S.jpg`
                : null;
              return (
                <div key={rec.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{rec.position}</div>
                    <div
                      onClick={() => onBookTap && onBookTap(recBook)}
                      style={{ width: 44, height: 64, flexShrink: 0, cursor: 'pointer' }}
                    >
                      {recCover ? (
                        <img src={recCover} alt="" style={{ width: 44, height: 64, borderRadius: 4, objectFit: 'cover', background: 'var(--border)' }} />
                      ) : (
                        <div style={{ width: 44, height: 64, borderRadius: 4, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📖</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        onClick={() => onBookTap && onBookTap(recBook)}
                        style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: 'var(--accent)' }}
                      >
                        {recBook?.title} →
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{recBook?.author}</div>
                    </div>
                  </div>
                  {rec.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginLeft: 32, marginTop: 8 }}>
                      {rec.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px 14px', borderTop: '1px solid var(--border)' }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 16, color: liked ? 'var(--accent)' : 'var(--text-light)' }}>{liked ? '♥' : '♡'}</span>
          <span style={{ fontSize: 12, color: liked ? 'var(--accent)' : 'var(--text-muted)' }}>{likeCount}</span>
        </button>
      </div>
    </div>
  );
}
