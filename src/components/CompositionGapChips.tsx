'use client';

import type { CompositionGap } from '@/types';

const classes: Record<CompositionGap['status'], string> = {
  danger: 'border-red-team/50 bg-red-team/15 text-red-200',
  success: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200',
  muted: 'border-zinc-500/40 bg-zinc-500/15 text-zinc-300',
};

export function CompositionGapChips({ gaps }: { gaps: CompositionGap[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {gaps.map((gap) => (
        <span key={gap.id} className={`rounded-md border px-3 py-1 text-xs ${classes[gap.status]}`} title={gap.description}>
          {gap.label} {gap.current}/{gap.expected}
        </span>
      ))}
    </div>
  );
}
