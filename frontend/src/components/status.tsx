'use client';

import { Flag, Strategy } from '@/lib/api';

export function EnvTag({ env }: { env: string }) {
  const prod = env.toUpperCase() === 'PROD';
  return (
    <span
      className={`mono text-[11px] font-semibold tracking-wider rounded px-1.5 py-0.5 border ${
        prod ? 'border-warn/30 text-warn bg-warn/5' : 'border-line text-muted bg-paper'
      }`}
    >
      {env.toUpperCase()}
    </span>
  );
}

export function StatusPill({ flag }: { flag: Flag }) {
  const on = flag.enabled && !(flag.strategy === 'PERCENTAGE_ROLLOUT' && flag.rolloutPercentage === 0);
  const partial = flag.enabled && flag.strategy === 'PERCENTAGE_ROLLOUT';
  const color = !flag.enabled ? 'off' : partial ? 'info' : 'on';
  const label = !flag.enabled ? 'Off' : partial ? `Rollout ${flag.rolloutPercentage}%` : 'On';
  const dot: Record<string, string> = { on: 'bg-on', off: 'bg-off', info: 'bg-info' };
  const text: Record<string, string> = { on: 'text-on', off: 'text-muted', info: 'text-info' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${text[color]}`}>
      <span className={`h-2 w-2 rounded-full ${dot[color]}`} />
      {label}
    </span>
  );
}

export function StrategyBadge({ strategy }: { strategy: Strategy }) {
  return (
    <span className="mono text-[11px] tracking-wide rounded border border-line bg-paper px-1.5 py-0.5 text-muted">
      {strategy === 'PERCENTAGE_ROLLOUT' ? 'PERCENT' : 'BOOLEAN'}
    </span>
  );
}

/** Signature element: a segmented meter that reads a rollout at a glance. */
export function RolloutMeter({ percentage }: { percentage: number }) {
  const segments = 20; // each segment = 5%
  const filled = Math.round((percentage / 100) * segments);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-[2px]" aria-hidden>
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-[6px] rounded-[1px] ${i < filled ? 'bg-info' : 'bg-line'}`}
          />
        ))}
      </div>
      <span className="mono text-xs text-muted tabular-nums">{percentage}%</span>
    </div>
  );
}
