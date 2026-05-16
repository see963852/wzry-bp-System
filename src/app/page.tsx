'use client';

import { useEffect } from 'react';
import { BanPickStage } from '@/components/BanPickStage';
import { DisabledHeroDrawer } from '@/components/DisabledHeroDrawer';
import { Header } from '@/components/Header';
import { HeroPool } from '@/components/HeroPool';
import { RecommendationPanel } from '@/components/RecommendationPanel';
import { TeamPanel } from '@/components/TeamPanel';
import { getCurrentTurnInfo } from '@/lib/draftEngine';
import { getHeroesByIds } from '@/lib/recommendationEngine';
import { useDraftStore } from '@/store/draftStore';

export default function HomePage() {
  const { draftState, heroPool, recommendation, undoAction } = useDraftStore();
  const turn = getCurrentTurnInfo(draftState);
  const bluePicks = getHeroesByIds(heroPool, draftState.bluePicks);
  const redPicks = getHeroesByIds(heroPool, draftState.redPicks);
  const blueBans = getHeroesByIds(heroPool, draftState.blueBans);
  const redBans = getHeroesByIds(heroPool, draftState.redBans);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undoAction();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undoAction]);

  return (
    <div className="min-h-screen bg-app text-zinc-100">
      <Header />
      <main className="mx-auto grid max-w-[1440px] gap-4 px-4 py-4">
        <section className="grid gap-4 xl:grid-cols-[260px_1fr_260px]">
          <TeamPanel team="blue" picks={bluePicks} bans={blueBans} active={turn.team === 'blue' && !draftState.isComplete} />
          <BanPickStage draftState={draftState} bluePicks={bluePicks} redPicks={redPicks} blueBans={blueBans} redBans={redBans} />
          <TeamPanel team="red" picks={redPicks} bans={redBans} active={turn.team === 'red' && !draftState.isComplete} />
        </section>
        <HeroPool />
        <RecommendationPanel recommendation={recommendation} />
      </main>
      <DisabledHeroDrawer />
    </div>
  );
}
