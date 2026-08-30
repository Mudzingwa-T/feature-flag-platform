'use client';

import { useState } from 'react';
import { api, ApiError, EvalResult } from '@/lib/api';
import { Banner, Field, Spinner, Toggle } from '@/components/ui';

export default function PlaygroundPage() {
  const [flagKey, setFlagKey] = useState('new-checkout');
  const [environmentKey, setEnvironmentKey] = useState('PROD');
  const [userId, setUserId] = useState('user-123');
  const [city, setCity] = useState('Harare');
  const [internal, setInternal] = useState(false);

  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function evaluate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<EvalResult>('/evaluate', {
        flagKey,
        environmentKey,
        context: { userId, attributes: { city: city || undefined, internal } },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Evaluation playground</h1>
        <p className="mt-1 text-sm text-muted">Send a user context and see exactly how a flag resolves — and why.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Flag key"><input className="input mono" value={flagKey} onChange={(e) => setFlagKey(e.target.value)} /></Field>
              <Field label="Environment">
                <select className="input" value={environmentKey} onChange={(e) => setEnvironmentKey(e.target.value)}>
                  <option value="DEV">DEV</option>
                  <option value="PROD">PROD</option>
                </select>
              </Field>
            </div>
            <Field label="User ID" hint="Bucketing is deterministic per user, so the same id always resolves the same way."><input className="input mono" value={userId} onChange={(e) => setUserId(e.target.value)} /></Field>
            <Field label="City"><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
            <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2.5">
              <span className="text-sm text-ink">Internal user</span>
              <Toggle checked={internal} onChange={setInternal} label="Internal user" />
            </div>
            <button className="btn-primary w-full" onClick={evaluate} disabled={loading || !flagKey}>
              {loading ? <Spinner label="Evaluating" /> : 'Evaluate'}
            </button>
          </div>
        </div>

        <div className="card p-5">
          <p className="label">Result</p>
          {!result && !error && <p className="mt-6 text-center text-sm text-muted">Run an evaluation to see the outcome.</p>}
          {error && <div className="mt-3"><Banner tone="error">{error}</Banner></div>}
          {result && (
            <div className="mt-3 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${result.enabled ? 'bg-on/10 text-on' : 'bg-off/10 text-muted'}`}>
                  <span className={`h-3 w-3 rounded-full ${result.enabled ? 'bg-on' : 'bg-off'}`} />
                </span>
                <div>
                  <p className="text-lg font-semibold text-ink">{result.enabled ? 'Enabled' : 'Disabled'}</p>
                  <p className="mono text-xs text-muted">{result.reason}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-sm">
                <dt className="text-muted">Flag</dt><dd className="mono">{result.flagKey}</dd>
                <dt className="text-muted">Environment</dt><dd className="mono">{result.environmentKey}</dd>
                {typeof result.bucket === 'number' && (<><dt className="text-muted">Bucket</dt><dd className="mono">{result.bucket} / 100</dd></>)}
                <dt className="text-muted">Evaluated</dt><dd className="mono text-xs">{new Date(result.evaluatedAt).toLocaleTimeString()}</dd>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
