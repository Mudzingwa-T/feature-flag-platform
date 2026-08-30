'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, Environment } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Banner, Spinner } from '@/components/ui';
import { FlagForm } from '@/components/flag-form';

export default function NewFlagPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [environments, setEnvironments] = useState<Environment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/');
  }, [user, router]);

  useEffect(() => {
    api
      .get<Environment[]>('/environments')
      .then(setEnvironments)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load environments'));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">New flag</h1>
        <p className="mt-1 text-sm text-muted">Define the flag, then choose how it rolls out.</p>
      </div>
      {error && <Banner tone="error">{error}</Banner>}
      {!environments && !error && <div className="card grid place-items-center py-16"><Spinner label="Loading" /></div>}
      {environments && <FlagForm mode="create" environments={environments} />}
    </div>
  );
}
