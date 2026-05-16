'use client';

import type { Hero } from '@/types';
import { getCurrentTurnInfo } from '@/lib/draftEngine';
import type { DraftState } from '@/types';
import { TurnIndicator } from '@/components/TurnIndicator';

interface BanPickStageProps {
  draftState: DraftState;
  bluePicks: Hero[];
  redPicks: Hero[];
  blueBans: Hero[];
  redBans: Hero[];
}

export function BanPickStage({ draftState, bluePicks, redPicks, blueBans, redBans }: BanPickStageProps) {
  const turn = getCurrentTurnInfo(draftState);

  return (
    <section className="rounded-md border border-white/10 bg-[#1a1d27] p-4">
      <div className="grid gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <SlotRow heroes={blueBans} total={5} type="ban" />
          <span className="text-sm font-bold text-zinc-500">VS</span>
          <SlotRow heroes={redBans} total={5} type="ban" reverse />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SlotRow heroes={bluePicks} total={5} type="pick-blue" />
          <SlotRow heroes={redPicks} total={5} type="pick-red" reverse />
        </div>
        <TurnIndicator turn={turn} />
      </div>
    </section>
  );
}

function SlotRow({ heroes, total, type, reverse = false }: { heroes: Hero[]; total: number; type: 'ban' | 'pick-blue' | 'pick-red'; reverse?: boolean }) {
  const slots = Array.from({ length: total }).map((_, index) => heroes[index]);
  if (reverse) slots.reverse();
  return (
    <div className="grid grid-cols-5 gap-2">
      {slots.map((hero, index) => {
        const border = type === 'pick-blue' ? 'border-blue-team/60' : type === 'pick-red' ? 'border-red-team/60' : 'border-white/10';
        return (
          <div key={`${type}-${index}`} className={`stage-slot ${border} ${type === 'ban' ? 'grayscale' : ''}`}>
            {hero ? <span>{hero.name.slice(0, 1)}</span> : <span className="text-zinc-600">{type === 'ban' ? 'Ban' : 'Pick'}</span>}
          </div>
        );
      })}
    </div>
  );
}
