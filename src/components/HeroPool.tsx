'use client';

import { useMemo, useState } from 'react';
import { getUsedHeroIds } from '@/lib/draftEngine';
import type { Role } from '@/types';
import { useDraftStore } from '@/store/draftStore';
import { HeroCard } from '@/components/HeroCard';

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

export function HeroPool() {
  const { draftState, heroPool, disabledHeroes } = useDraftStore();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');
  const usedHeroIds = getUsedHeroIds(draftState);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return heroPool.filter((hero) => {
      const heroRoles = hero.roles ?? [hero.role];
      const roleMatch = role === 'all' || heroRoles.includes(role);
      const queryMatch = !lower || hero.name.toLowerCase().includes(lower) || hero.displayName.toLowerCase().includes(lower);
      return roleMatch && queryMatch;
    });
  }, [heroPool, query, role]);

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
              {roleLabel[item]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {filtered.map((hero) => (
          <HeroCard key={hero.id} hero={hero} disabled={usedHeroIds.has(hero.id) || disabledHeroes.includes(hero.id)} />
        ))}
      </div>
    </section>
  );
}
