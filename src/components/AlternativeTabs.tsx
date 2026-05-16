'use client';

import { useState } from 'react';
import type { AlternativePlan } from '@/types';

export function AlternativeTabs({ plans }: { plans: AlternativePlan[] }) {
  const [tab, setTab] = useState<'A' | 'B'>('A');
  const visible = tab === 'A' ? plans.slice(0, 2) : plans.slice(2, 3);

  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex gap-2">
        {(['A', 'B'] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? 'primary-pill' : 'secondary-pill'} onClick={() => setTab(item)}>
            備選方案 {item}
          </button>
        ))}
      </div>
      <div className="space-y-2 text-sm text-zinc-300">
        {visible.length ? visible.map((plan) => (
          <div key={plan.predictedEnemyHeroId} className="rounded border border-white/10 p-3">
            若紅方選 <span className="text-red-300">{plan.predictedEnemyHeroName}</span>，藍方建議選{' '}
            <span className="text-blue-300">{plan.responseHeroName}</span>：{plan.reason}
          </div>
        )) : <div className="text-zinc-500">目前輪次不需要敵方預測。</div>}
      </div>
    </div>
  );
}
