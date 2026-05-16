'use client';

import { useMemo, useState } from 'react';
import type { Hero, HeroScore, Role } from '@/types';
import { getCurrentTurnInfo, isHeroAvailable } from '@/lib/draftEngine';
import { scoreHeroForDraft, getHeroesByIds } from '@/lib/recommendationEngine';
import { useDraftStore } from '@/store/draftStore';
import { HeroCard } from '@/components/HeroCard';
import { HeroPickModal } from '@/components/HeroPickModal';

const roles: Array<'all' | Role> = ['all', 'tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];

export function HeroPool() {
  const { draftState, heroPool, disabledHeroes, performAction } = useDraftStore();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');
  const [selected, setSelected] = useState<HeroScore | null>(null);
  const turn = getCurrentTurnInfo(draftState);

  const myTeam = getHeroesByIds(heroPool, turn.team === 'blue' ? draftState.bluePicks : draftState.redPicks);
  const enemyTeam = getHeroesByIds(heroPool, turn.team === 'blue' ? draftState.redPicks : draftState.bluePicks);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return heroPool.filter((hero) => {
      const roleMatch = role === 'all' || hero.role === role;
      const queryMatch = !lower || hero.name.toLowerCase().includes(lower) || hero.displayName.toLowerCase().includes(lower);
      return roleMatch && queryMatch;
    });
  }, [heroPool, query, role]);

  function openHero(hero: Hero) {
    if (!isHeroAvailable(draftState, hero.id) || disabledHeroes.includes(hero.id) || draftState.isComplete) return;
    setSelected(scoreHeroForDraft(hero, myTeam, enemyTeam, heroPool));
  }

  function confirmHero() {
    if (!selected) return;
    performAction(selected.heroId);
    setSelected(null);
  }

  return (
    <section className="rounded-md border border-white/10 bg-[#1a1d27] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          className="min-h-10 flex-1 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-blue-team"
          placeholder="搜尋英雄"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {roles.map((item) => (
            <button key={item} type="button" className={role === item ? 'primary-pill' : 'secondary-pill'} onClick={() => setRole(item)}>
              {item === 'all' ? '全部' : item}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {filtered.map((hero) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            disabled={!isHeroAvailable(draftState, hero.id) || disabledHeroes.includes(hero.id) || draftState.isComplete}
            onClick={() => openHero(hero)}
          />
        ))}
      </div>
      <HeroPickModal score={selected} actionLabel={turn.type === 'ban' ? '禁用' : '選用'} onConfirm={confirmHero} onClose={() => setSelected(null)} />
    </section>
  );
}
