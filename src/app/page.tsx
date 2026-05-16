'use client';

import { useEffect } from 'react';
import { BanPickStage } from '@/components/BanPickStage';
import { DisabledHeroDrawer } from '@/components/DisabledHeroDrawer';
import { Header } from '@/components/Header';
import { HeroPickModal } from '@/components/HeroPickModal';
import { HeroPool } from '@/components/HeroPool';
import { RecommendationPanel } from '@/components/RecommendationPanel';
import { TeamPanel } from '@/components/TeamPanel';
import { getCurrentPickTurn } from '@/lib/draftEngine';
import { getHeroesByIds } from '@/lib/recommendationEngine';
import { useDraftStore } from '@/store/draftStore';

export default function HomePage() {
  const {
    draftState,
    heroPool,
    disabledHeroes,
    recommendation,
    activateSlot,
    confirmHeroSelection,
    closeModal,
    undoAction,
  } = useDraftStore();

  const currentPickTurn = getCurrentPickTurn(draftState);
  const bluePicks = getHeroesByIds(heroPool, draftState.bluePicks);
  const redPicks = getHeroesByIds(heroPool, draftState.redPicks);
  const blueBans = getHeroesByIds(heroPool, draftState.blueBans);
  const redBans = getHeroesByIds(heroPool, draftState.redBans);
  const activeSlot = draftState.activeSlot;

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
          <TeamPanel
            team="blue"
            picks={bluePicks}
            bans={blueBans}
            active={(draftState.phase === 'BAN_PHASE' && !draftState.isComplete) || currentPickTurn?.team === 'blue'}
          />
          <BanPickStage draftState={draftState} onSlotClick={activateSlot} heroPool={heroPool} />
          <TeamPanel
            team="red"
            picks={redPicks}
            bans={redBans}
            active={(draftState.phase === 'BAN_PHASE' && !draftState.isComplete) || currentPickTurn?.team === 'red'}
          />
        </section>
        <HeroPool />
        <RecommendationPanel recommendation={recommendation} />
      </main>
      <HeroPickModal
        isOpen={Boolean(activeSlot)}
        mode={activeSlot?.type ?? 'pick'}
        team={activeSlot?.team ?? 'blue'}
        draftState={draftState}
        disabledHeroes={disabledHeroes}
        onSelect={confirmHeroSelection}
        onClose={closeModal}
      />
      <DisabledHeroDrawer />
    </div>
  );
}
