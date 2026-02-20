import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState('signin'); // signin or signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (!displayName.trim()) { setError('Display name is required'); setLoading(false); return; }
      if (!handle.trim()) { setError('Handle is required'); setLoading(false); return; }
      const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const { error: err } = await signUp(email, password, displayName.trim(), cleanHandle);
      if (err) { setError(err.message); setLoading(false); return; }
      setSignupSuccess(true);
    } else {
      const { error: err } = await signIn(email, password);
      if (err) setError(err.message);
    }
    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 24 }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and sign in.
        </p>
        <button className="btn-secondary" onClick={() => { setMode('signin'); setSignupSuccess(false); }}>
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      {/* Logo / Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)', marginBottom: 4 }}>3BR</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Three Book Recommendations</div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 340 }}>
        {mode === 'signup' && (
          <>
            <input
              className="input"
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: 14 }}>@</span>
              <input
                className="input"
                type="text"
                placeholder="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </>
        )}

        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {error && (
          <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</div>
        )}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}
