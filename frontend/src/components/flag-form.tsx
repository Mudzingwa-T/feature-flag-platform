'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError, Environment, Flag, Strategy } from '@/lib/api';
import { Banner, Field, Spinner, Toggle } from './ui';
import { RuleAssistant } from './rule-assistant';
import { buildConstraints } from '@/lib/flag-rules';

interface Props {
  mode: 'create' | 'edit';
  environments: Environment[];
  flag?: Flag;
}

export function FlagForm({ mode, environments, flag }: Props) {
  const router = useRouter();

  const [key, setKey] = useState(flag?.key ?? '');
  const [environmentKey, setEnvironmentKey] = useState(flag?.environmentKey ?? environments[0]?.key ?? 'DEV');
  const [description, setDescription] = useState(flag?.description ?? '');
  const [enabled, setEnabled] = useState(flag?.enabled ?? false);
  const [strategy, setStrategy] = useState<Strategy>(flag?.strategy ?? 'BOOLEAN');
  const [rolloutPercentage, setRolloutPercentage] = useState(flag?.rolloutPercentage ?? 0);
  const [cities, setCities] = useState((flag?.constraints?.includeCities ?? []).join(', '));
  const [excludeInternal, setExcludeInternal] = useState(flag?.constraints?.excludeInternal ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setConflict(false);
    try {
      if (mode === 'create') {
        await api.post('/flags', {
          key,
          environmentKey,
          description: description || undefined,
          enabled,
          strategy,
          rolloutPercentage: strategy === 'PERCENTAGE_ROLLOUT' ? rolloutPercentage : 0,
          constraints: buildConstraints(cities, excludeInternal) ?? undefined,
        });
      } else if (flag) {
        await api.patch(`/flags/${flag.id}`, {
          expectedVersion: flag.version,
          description,
          enabled,
          strategy,
          rolloutPercentage: strategy === 'PERCENTAGE_ROLLOUT' ? rolloutPercentage : 0,
          constraints: buildConstraints(cities, excludeInternal),
        });
      }
      router.push('/');
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setConflict(true);
      } else {
        setError(e instanceof ApiError ? e.message : 'Something went wrong');
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!flag) return;
    if (!window.confirm(`Delete flag "${flag.key}" in ${flag.environmentKey}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await api.del(`/flags/${flag.id}`);
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Delete failed');
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="card p-5">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Flag key" hint={mode === 'edit' ? 'Immutable' : 'kebab-case, unique per environment'}>
              <input
                className="input mono disabled:opacity-60"
                value={key}
                disabled={mode === 'edit'}
                placeholder="new-checkout"
                onChange={(e) => setKey(e.target.value)}
              />
            </Field>
            <Field label="Environment">
              <select
                className="input disabled:opacity-60"
                value={environmentKey}
                disabled={mode === 'edit'}
                onChange={(e) => setEnvironmentKey(e.target.value)}
              >
                {environments.map((env) => (
                  <option key={env.key} value={env.key}>
                    {env.key} — {env.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <input className="input" value={description} placeholder="What does this flag control?" onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-ink">Enabled</p>
              <p className="text-xs text-muted">Master switch. When off, the flag never evaluates true.</p>
            </div>
            <Toggle checked={enabled} onChange={setEnabled} label="Enabled" />
          </div>

          <Field label="Strategy">
            <select className="input" value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)}>
              <option value="BOOLEAN">Boolean — on/off for everyone</option>
              <option value="PERCENTAGE_ROLLOUT">Percentage rollout — deterministic per user</option>
            </select>
          </Field>

          {strategy === 'PERCENTAGE_ROLLOUT' && (
            <div className="space-y-4 rounded-lg border border-line p-4">
              <Field label={`Rollout percentage — ${rolloutPercentage}%`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={rolloutPercentage}
                  onChange={(e) => setRolloutPercentage(Number(e.target.value))}
                  className="w-full accent-info"
                />
              </Field>
              <Field label="Include cities" hint="Comma-separated. Leave blank for all cities.">
                <input className="input mono" value={cities} placeholder="Harare, Bulawayo" onChange={(e) => setCities(e.target.value)} />
              </Field>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">Exclude internal users</p>
                  <p className="text-xs text-muted">Skip anyone whose context marks them internal.</p>
                </div>
                <Toggle checked={excludeInternal} onChange={setExcludeInternal} label="Exclude internal" />
              </div>
            </div>
          )}

          {conflict && (
            <Banner tone="warn">
              This flag was changed by someone else since you opened it. Reload to get the latest version, then re-apply your change.
              <button className="btn-secondary ml-3" onClick={() => router.refresh()}>Reload</button>
            </Banner>
          )}
          {error && <Banner tone="error">{error}</Banner>}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button className="btn-primary" onClick={save} disabled={saving || (mode === 'create' && !key)}>
                {saving ? <Spinner label="Saving" /> : mode === 'create' ? 'Create flag' : 'Save changes'}
              </button>
              <button className="btn-ghost" onClick={() => router.push('/')} disabled={saving}>
                Cancel
              </button>
            </div>
            {mode === 'edit' && (
              <button className="btn-danger" onClick={remove} disabled={saving}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <RuleAssistant
          onApply={(p) => {
            setStrategy(p.strategy);
            setEnabled(p.enabled);
            setRolloutPercentage(p.rolloutPercentage);
            setCities((p.constraints?.includeCities ?? []).join(', '));
            setExcludeInternal(Boolean(p.constraints?.excludeInternal));
          }}
        />
        {mode === 'edit' && flag && (
          <div className="card p-4 text-sm">
            <p className="label">Current version</p>
            <p className="mono text-ink">v{flag.version}</p>
            <p className="mt-2 text-xs text-muted">
              Saving checks this version. If someone else saved first, you'll be asked to reload — no silent overwrite.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
