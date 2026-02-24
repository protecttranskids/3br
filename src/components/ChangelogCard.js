// Update this card whenever you push changes to the app.
// Just edit the DATE and ITEMS below, commit, and Vercel will redeploy.

const DATE = 'Feb 23, 2025';

const ITEMS = [
  'The feed now shows when people add books to their shelves',
  'After adding a book, you can jump to your library or back to the feed',
  'New users get a quick onboarding walkthrough',
  'You can see when new people join 3BR',
  'Feedback form is on your profile page — please use it!',
];

export default function ChangelogCard() {
  return (
    <div style={{ margin: '0 16px 16px', padding: 16, borderRadius: 16, background: 'var(--card)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>🆕</span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>What's New</span>
        <span style={{ fontSize: 10, color: 'var(--text-light)', marginLeft: 'auto' }}>{DATE}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ITEMS.map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, display: 'flex', gap: 6 }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
