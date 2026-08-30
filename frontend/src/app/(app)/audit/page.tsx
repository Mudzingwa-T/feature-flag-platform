'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, AuditRecord, Paginated } from '@/lib/api';
import { Banner, EmptyState, Spinner } from '@/components/ui';
import { EnvTag } from '@/components/status';

const actionTone: Record<string, string> = {
  CREATE: 'text-on bg-on/10 border-on/20',
  UPDATE: 'text-info bg-info/10 border-info/20',
  DELETE: 'text-danger bg-danger/10 border-danger/20',
};

export default function AuditPage() {
  const [data, setData] = useState<Paginated<AuditRecord> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.get<Paginated<AuditRecord>>(`/audit?page=${page}&pageSize=20`));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Audit trail</h1>
        <p className="mt-1 text-sm text-muted">Every change, who made it, and what it changed. Append-only.</p>
      </div>

      {loading && <div className="card grid place-items-center py-16"><Spinner label="Loading audit log" /></div>}
      {error && !loading && <Banner tone="error">{error}</Banner>}
      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState title="Nothing logged yet">Changes to flags will appear here as they happen.</EmptyState>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="card divide-y divide-line">
            {data.items.map((r) => (
              <div key={r.id}>
                <button
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper/60"
                >
                  <span className={`mono rounded border px-1.5 py-0.5 text-[11px] font-semibold ${actionTone[r.action]}`}>
                    {r.action}
                  </span>
                  <span className="mono text-sm font-medium text-ink">{r.flagKey}</span>
                  <EnvTag env={r.environmentKey} />
                  <span className="ml-auto text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
                  <span className="mono text-[11px] text-off">{r.actor}</span>
                </button>
                {openId === r.id && (
                  <div className="grid gap-3 bg-paper/50 px-4 py-3 md:grid-cols-2">
                    <div>
                      <p className="label">Before</p>
                      <pre className="mono overflow-x-auto rounded-md border border-line bg-surface p-2 text-xs">{JSON.stringify(r.previousValue, null, 2) ?? 'null'}</pre>
                    </div>
                    <div>
                      <p className="label">After</p>
                      <pre className="mono overflow-x-auto rounded-md border border-line bg-surface p-2 text-xs">{JSON.stringify(r.newValue, null, 2) ?? 'null'}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted">{data.total} records</span>
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
              <span className="mono text-xs text-muted">{page} / {totalPages}</span>
              <button className="btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
