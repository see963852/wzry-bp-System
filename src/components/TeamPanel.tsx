'use client';

import type { Hero, Team } from '@/types';

interface TeamPanelProps {
  team: Team;
  picks: Hero[];
  bans: Hero[];
  active: boolean;
}

export function TeamPanel({ team, picks, bans, active }: TeamPanelProps) {
  const isBlue = team === 'blue';
  const border = isBlue ? 'border-blue-team/60' : 'border-red-team/60';
  const glow = active ? (isBlue ? 'current-blue-glow' : 'current-red-glow') : '';

  return (
    <aside className={`rounded-md border bg-[#1a1d27] p-4 ${active ? border : 'border-white/10'} ${glow}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">{isBlue ? '藍方' : '紅方'}</h2>
        <span className={isBlue ? 'text-blue-team' : 'text-red-team'}>{picks.length}/5</span>
      </div>
      <div className="mb-4">
        <div className="mb-2 text-xs text-zinc-400">Ban 位</div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="ban-slot">
              {bans[index]?.name.slice(0, 1) ?? ''}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs text-zinc-400">已選英雄</div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const hero = picks[index];
            return (
              <div key={index} className={`pick-row ${isBlue ? 'border-blue-team/50' : 'border-red-team/50'}`}>
                {hero ? (
                  <>
                    <span className="grid size-8 place-items-center rounded bg-white/10 text-sm font-bold">{hero.name.slice(0, 1)}</span>
                    <span className="min-w-0 truncate">{hero.displayName}</span>
                    <span className="ml-auto text-xs text-zinc-400">{hero.tier}</span>
                  </>
                ) : (
                  <span className="text-zinc-500">空位</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
