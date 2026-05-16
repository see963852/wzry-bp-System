'use client';

import type { Hero } from '@/types';

interface HeroCardProps {
  hero: Hero;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const tierClass: Record<Hero['tier'], string> = {
  T0: 'bg-[#f6c90e] text-black',
  T1: 'bg-[#a8b2c1] text-black',
  T2: 'bg-sky-700 text-white',
  T3: 'bg-zinc-700 text-zinc-100',
};

export function HeroCard({ hero, disabled = false, selected = false, onClick }: HeroCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`hero-card group min-h-[104px] rounded-md border p-3 text-left transition ${
        selected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-[#1a1d27]'
      } ${disabled ? 'cursor-not-allowed opacity-35 grayscale' : 'hover:border-white/30 hover:bg-white/[0.06]'}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="grid size-10 place-items-center rounded-md bg-white/10 text-sm font-bold text-white">
          {hero.name.slice(0, 1)}
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${tierClass[hero.tier]}`}>{hero.tier}</span>
      </div>
      <div className="truncate text-sm font-semibold text-white">{hero.displayName}</div>
      <div className="mt-1 text-xs text-zinc-400">{hero.lane} · 勝率 {(hero.winRate * 100).toFixed(1)}%</div>
    </button>
  );
}
