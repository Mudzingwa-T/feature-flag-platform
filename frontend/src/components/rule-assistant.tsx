'use client';

import { useState } from 'react';
import { api, ApiError, RuleProposal } from '@/lib/api';
import { Banner, Field, Spinner } from './ui';

/**
 * AI rule assistant. Turns a sentence into a *proposed* structured rule. It never
 * saves anything: the reviewer sees exactly what the model returned, then chooses
 * to apply it to the form (or not). Applying still requires a normal Save.
 */
export function RuleAssistant({
  onApply,
}: {
  onApply: (p: RuleProposal['proposal']) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RuleProposal | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<RuleProposal>('/ai/rule-proposals', { prompt });
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the assistant');
    } finally {
      setLoading(false);
    }
  }

  const p = result?.proposal;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Rule assistant</h3>
          <p className="text-xs text-muted">Describe the rollout in plain English. Output is a proposal you review before saving.</p>
        </div>
        <span className="kbd">AI</span>
      </div>

      <Field label="Describe the rule">
        <textarea
          className="input min-h-[64px] resize-y"
          placeholder="e.g. enable for 20% of users in Harare, except internal staff"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </Field>

      <div className="mt-3 flex items-center gap-3">
        <button type="button" className="btn-secondary" onClick={generate} disabled={loading || prompt.trim().length < 3}>
          {loading ? <Spinner label="Thinking" /> : 'Propose rule'}
        </button>
        {result && (
          <span className="mono text-xs text-muted">
            via {result.provider}
          </span>
        )}
      </div>

      {error && <div className="mt-3"><Banner tone="error">{error}</Banner></div>}

      {result && p && (
        <div className="mt-4 space-y-3">
          {result.warnings.length > 0 && (
            <Banner tone="warn">{result.warnings.join(' ')}</Banner>
          )}

          <div className="rounded-lg border border-line bg-paper p-3">
            <p className="label mb-2">Proposed</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted">Enabled</dt>
              <dd className="mono">{String(p.enabled)}</dd>
              <dt className="text-muted">Strategy</dt>
              <dd className="mono">{p.strategy}</dd>
              <dt className="text-muted">Rollout</dt>
              <dd className="mono">{p.rolloutPercentage}%</dd>
              {p.constraints?.includeCities && (
                <>
                  <dt className="text-muted">Cities</dt>
                  <dd className="mono">{p.constraints.includeCities.join(', ')}</dd>
                </>
              )}
              {p.constraints?.excludeInternal && (
                <>
                  <dt className="text-muted">Exclude internal</dt>
                  <dd className="mono">true</dd>
                </>
              )}
            </dl>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="btn-primary" onClick={() => onApply(p)}>
              Apply to form
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? 'Hide' : 'Show'} raw output
            </button>
          </div>

          {showRaw && (
            <pre className="mono overflow-x-auto rounded-lg border border-line bg-ink/95 p-3 text-xs text-white/90">
              {JSON.stringify(result.raw, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
