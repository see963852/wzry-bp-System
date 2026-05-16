'use client';

import type { HeroScore } from '@/types';

export function RecommendCard({ score, rank }: { score: HeroScore; rank: number }) {
  return (
    <article className="rounded-md border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-zinc-500">TOP {rank}</div>
          <h3 className="text-base font-bold text-white">{score.hero.displayName}</h3>
          <div className="text-xs text-zinc-400">{score.hero.role} · {score.hero.lane} · {score.hero.tier}</div>
        </div>
        <div className="text-2xl font-black text-emerald-400">{score.totalScore}</div>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded bg-white/10">
        <div className="h-full rounded bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500" style={{ width: `${score.totalScore}%` }} />
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2 text-center text-[11px] text-zinc-400">
        <span>克制 {score.counterScore}</span>
        <span>互補 {score.compositionScore}</span>
        <span>機制 {score.mechanismScore}</span>
        <span>版本 {score.metaScore}</span>
      </div>
      <ul className="space-y-1 text-sm text-zinc-300">
        {score.reasons.slice(0, 3).map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </article>
  );
}
