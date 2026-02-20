import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}
