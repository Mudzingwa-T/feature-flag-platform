'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Banner, Field, Spinner } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('admin@ff.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white mono text-sm font-bold">FF</span>
          <span className="text-sm font-semibold tracking-tight">Feature Flags Control Plane</span>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Use a seeded account to explore.</p>

          <div className="mt-5 space-y-4">
            <Field label="Email">
              <input className="input" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </Field>
            {error && <Banner tone="error">{error}</Banner>}
            <button className="btn-primary w-full" onClick={submit} disabled={loading}>
              {loading ? <Spinner label="Signing in" /> : 'Sign in'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-xs text-muted">
          <p className="mb-1 font-medium text-ink">Demo accounts</p>
          <p className="mono">admin@ff.local · admin123 <span className="text-off">(ADMIN)</span></p>
          <p className="mono">viewer@ff.local · viewer123 <span className="text-off">(VIEWER)</span></p>
        </div>
      </div>
    </main>
  );
}
