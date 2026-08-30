'use client';

import { ReactNode } from 'react';

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" role="status">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line border-t-brand" />
      {label}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Banner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error' | 'success' | 'warn';
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    info: 'border-info/20 bg-info/5 text-info',
    error: 'border-danger/20 bg-danger/5 text-danger',
    success: 'border-on/20 bg-on/5 text-on',
    warn: 'border-warn/20 bg-warn/5 text-warn',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${map[tone]}`} role={tone === 'error' ? 'alert' : undefined}>
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted">{children}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-on' : 'bg-line'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
