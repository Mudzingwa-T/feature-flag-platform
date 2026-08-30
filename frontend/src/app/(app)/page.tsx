'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, Flag, Paginated } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { EnvTag, RolloutMeter, StatusPill, StrategyBadge } from '@/components/status';

const FILTERS = ['ALL', 'DEV', 'PROD'];

export default function FlagsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [data, setData] = useState<Paginated<Flag> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = filter === 'ALL' ? '' : `?environment=${filter}`;
      setData(await api.get<Paginated<Flag>>(`/flags${q}`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Flags</h1>
          <p className="mt-1 text-sm text-muted">Every flag, its rollout and where it lives.</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link href="/flags/new" className="btn-primary">
            New flag
          </Link>
        )}
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-line bg-surface p-0.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`mono rounded-md px-3 py-1.5 text-xs tracking-wide transition-colors ${
              filter === f ? 'bg-ink text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card grid place-items-center py-16">
          <Spinner label="Loading flags" />
        </div>
      )}

      {error && !loading && <Banner tone="error">{error}</Banner>}

      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState title="No flags here yet">
          {user?.role === 'ADMIN'
            ? 'Create your first flag to start rolling features out safely.'
            : 'An administrator hasn’t created any flags in this environment.'}
        </EmptyState>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Flag</th>
                <th className="px-4 py-3 font-medium">Env</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Rollout</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((flag) => (
                <tr key={flag.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3">
                    <div className="mono font-medium text-ink">{flag.key}</div>
                    {flag.description && <div className="text-xs text-muted">{flag.description}</div>}
                  </td>
                  <td className="px-4 py-3"><EnvTag env={flag.environmentKey} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusPill flag={flag} />
                      <StrategyBadge strategy={flag.strategy} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {flag.strategy === 'PERCENTAGE_ROLLOUT' ? (
                      <RolloutMeter percentage={flag.rolloutPercentage} />
                    ) : (
                      <span className="text-xs text-off">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted">{new Date(flag.updatedAt).toLocaleDateString()}</div>
                    {flag.updatedBy && <div className="mono text-[11px] text-off">{flag.updatedBy}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user?.role === 'ADMIN' ? (
                      <Link href={`/flags/${flag.id}/edit`} className="text-sm text-brand hover:underline">
                        Edit
                      </Link>
                    ) : (
                      <span className="text-xs text-off">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
