'use client';

import { getCurrentPickTurn, isSlotClickable, PICK_ORDER } from '@/lib/draftEngine';
import type { DraftActionType, DraftState, Hero, Team } from '@/types';

interface BanPickStageProps {
  draftState: DraftState;
  onSlotClick: (team: Team, type: DraftActionType, slotIndex: number) => void;
  heroPool: Hero[];
}

const teamLabel: Record<Team, string> = {
  blue: '藍方',
  red: '紅方',
};

export function BanPickStage({ draftState, onSlotClick, heroPool }: BanPickStageProps) {
  const heroMap = new Map(heroPool.map((hero) => [hero.id, hero]));
  const currentPickTurn = getCurrentPickTurn(draftState);

  return (
    <section className="rounded-md border border-white/10 bg-[#1a1d27] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">中央 Ban/Pick 舞台</h2>
          <p className="text-sm text-zinc-400">
            {draftState.phase === 'BAN_PHASE'
              ? `Ban 階段：藍方 ${draftState.blueBans.filter(Boolean).length}/5，紅方 ${draftState.redBans.filter(Boolean).length}/5`
              : draftState.phase === 'PICK_PHASE' && currentPickTurn
                ? `${teamLabel[currentPickTurn.team]} Pick ${currentPickTurn.slotIndex + 1}`
                : 'BP 已完成'}
          </p>
        </div>
        <span className="rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-zinc-300">{draftState.phase}</span>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <SlotGrid
              team="blue"
              type="ban"
              values={draftState.blueBans}
              draftState={draftState}
              heroMap={heroMap}
              onSlotClick={onSlotClick}
            />
            <span className="text-sm font-bold text-zinc-500">BAN</span>
            <SlotGrid
              team="red"
              type="ban"
              values={draftState.redBans}
              draftState={draftState}
              heroMap={heroMap}
              onSlotClick={onSlotClick}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SlotGrid
            team="blue"
            type="pick"
            values={draftState.bluePicks}
            draftState={draftState}
            heroMap={heroMap}
            onSlotClick={onSlotClick}
          />
          <SlotGrid
            team="red"
            type="pick"
            values={draftState.redPicks}
            draftState={draftState}
            heroMap={heroMap}
            onSlotClick={onSlotClick}
          />
        </div>
      </div>
    </section>
  );
}

function SlotGrid({
  team,
  type,
  values,
  draftState,
  heroMap,
  onSlotClick,
}: {
  team: Team;
  type: DraftActionType;
  values: Array<string | null>;
  draftState: DraftState;
  heroMap: Map<string, Hero>;
  onSlotClick: (team: Team, type: DraftActionType, slotIndex: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {values.map((heroId, slotIndex) => {
        const hero = heroId ? heroMap.get(heroId) : null;
        const clickable = isSlotClickable(draftState, team, type, slotIndex);
        const active =
          draftState.activeSlot?.team === team &&
          draftState.activeSlot.type === type &&
          draftState.activeSlot.slotIndex === slotIndex;
        const pickTurn = getCurrentPickTurn(draftState);
        const isCurrentPick = type === 'pick' && pickTurn?.team === team && pickTurn.slotIndex === slotIndex;
        const borderColor = team === 'blue' ? 'border-blue-team/70' : 'border-red-team/70';
        const orderNumber = type === 'pick' ? PICK_ORDER.findIndex((turn) => turn.team === team && turn.slotIndex === slotIndex) + 1 : null;

        return (
          <button
            key={`${team}-${type}-${slotIndex}`}
            type="button"
            disabled={!clickable}
            onClick={() => onSlotClick(team, type, slotIndex)}
            className={[
              'relative min-h-[72px] rounded-md border p-2 text-center transition',
              hero ? 'bg-black/25' : 'border-dashed bg-white/[0.03]',
              borderColor,
              clickable ? 'cursor-pointer hover:bg-white/[0.08]' : 'cursor-default opacity-80',
              active ? 'slot-active' : '',
              isCurrentPick ? (team === 'blue' ? 'current-blue-glow' : 'current-red-glow') : '',
              type === 'ban' && hero ? 'grayscale' : '',
            ].join(' ')}
          >
            {hero ? (
              <div className="flex h-full flex-col items-center justify-center gap-1">
                <span className="grid size-9 place-items-center rounded bg-white/10 text-sm font-bold text-white">{hero.name.slice(0, 1)}</span>
                <span className="line-clamp-1 text-xs font-semibold text-zinc-100">{hero.displayName}</span>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-zinc-500">
                <span className="text-xs font-semibold">{type === 'ban' ? 'Ban' : `Pick ${orderNumber}`}</span>
                <span className="text-[11px]">{teamLabel[team]}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
