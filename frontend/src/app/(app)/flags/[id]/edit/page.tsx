'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError, Environment, Flag } from '@/lib/api';
import { Banner, Spinner } from '@/components/ui';
import { FlagForm } from '@/components/flag-form';
import { EnvTag } from '@/components/status';

export default function EditFlagPage() {
  const params = useParams<{ id: string }>();
  const [flag, setFlag] = useState<Flag | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [f, envs] = await Promise.all([
          api.get<Flag>(`/flags/${params.id}`),
          api.get<Environment[]>('/environments'),
        ]);
        setFlag(f);
        setEnvironments(envs);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load flag');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <div className="card grid place-items-center py-16"><Spinner label="Loading flag" /></div>;
  if (error) return <Banner tone="error">{error}</Banner>;
  if (!flag) return <Banner tone="error">Flag not found.</Banner>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="mono text-xl font-semibold tracking-tight text-ink">{flag.key}</h1>
        <EnvTag env={flag.environmentKey} />
      </div>
      <FlagForm mode="edit" environments={environments} flag={flag} />
    </div>
  );
}
