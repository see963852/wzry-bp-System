'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { isHeroSelectableForActiveSlot } from '@/lib/draftEngine';
import type { DraftActionType, DraftState, Role, Team } from '@/types';
import { HeroCard } from '@/components/HeroCard';

interface HeroSelectModalProps {
  isOpen: boolean;
  mode: DraftActionType;
  team: Team;
  draftState: DraftState;
  disabledHeroes: string[];
  onSelect: (heroId: string) => void;
  onClose: () => void;
}

const roles: Array<'all' | Role> = ['all', 'tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];

const roleLabel: Record<'all' | Role, string> = {
  all: '全部',
  tank: '坦克',
  fighter: '戰士',
  assassin: '刺客',
  mage: '法師',
  marksman: '射手',
  support: '輔助',
};

export function HeroPickModal({ isOpen, mode, team, draftState, disabledHeroes, onSelect, onClose }: HeroSelectModalProps) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setRole('all');
    }
  }, [isOpen]);

  const filteredHeroes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return draftState.heroPool.filter((hero) => {
      const heroRoles = hero.roles ?? [hero.role];
      const matchesRole = role === 'all' || heroRoles.includes(role);
      const matchesQuery = !keyword || hero.name.toLowerCase().includes(keyword) || hero.displayName.toLowerCase().includes(keyword);
      return matchesRole && matchesQuery;
    });
  }, [draftState.heroPool, query, role]);

  if (!isOpen || !draftState.activeSlot) return null;

  const theme = team === 'blue' ? 'border-blue-team/70 text-blue-200' : 'border-red-team/70 text-red-200';
  const title = `選擇要 ${mode === 'ban' ? 'Ban' : 'Pick'} 的英雄`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4" onClick={onClose}>
      <div
        className={`mx-auto mt-6 flex max-h-[88vh] w-full max-w-5xl flex-col rounded-md border bg-[#1a1d27] shadow-2xl ${theme}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{team === 'blue' ? '藍方' : '紅方'} · 第 {draftState.activeSlot.slotIndex + 1} 格</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-white/10 p-4">
          <input
            className="mb-3 min-h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-team"
            placeholder="搜尋英雄"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {roles.map((item) => (
              <button key={item} type="button" className={role === item ? 'primary-pill' : 'secondary-pill'} onClick={() => setRole(item)}>
                {roleLabel[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6">
          {filteredHeroes.map((hero) => {
            const selectable = isHeroSelectableForActiveSlot(draftState, hero.id, disabledHeroes);
            return (
              <HeroCard
                key={hero.id}
                hero={hero}
                disabled={!selectable}
                onClick={() => {
                  if (selectable) onSelect(hero.id);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
