'use client';

import { create } from 'zustand';
import { HEROES } from '@/data/heroData';
import {
  activateSlot as activateDraftSlot,
  clearActiveSlot,
  confirmHeroSelection as confirmDraftHeroSelection,
  initDraftState,
  undoDraftAction,
} from '@/lib/draftEngine';
import { generateRecommendation } from '@/lib/recommendationEngine';
import type { DraftActionType, DraftState, Hero, Recommendation, Team } from '@/types';

interface DraftStore {
  draftState: DraftState;
  heroPool: Hero[];
  disabledHeroes: string[];
  recommendation: Recommendation | null;
  isCalculating: boolean;
  dataVersion: string;
  lastSynced: Date | null;
  initDraft: () => void;
  activateSlot: (team: Team, type: DraftActionType, slotIndex: number) => void;
  confirmHeroSelection: (heroId: string) => void;
  closeModal: () => void;
  performAction: (heroId: string) => void;
  undoAction: () => void;
  toggleDisabledHero: (heroId: string) => void;
  syncHeroData: () => Promise<void>;
}

const initialDraftState = initDraftState(HEROES);

export const useDraftStore = create<DraftStore>((set, get) => ({
  draftState: initialDraftState,
  heroPool: HEROES,
  disabledHeroes: [],
  recommendation: generateRecommendation(initialDraftState, []),
  isCalculating: false,
  dataVersion: 'S43',
  lastSynced: null,

  initDraft: () => {
    const heroPool = get().heroPool;
    const draftState = initDraftState(heroPool);
    set({
      draftState,
      recommendation: generateRecommendation(draftState, get().disabledHeroes),
    });
  },

  activateSlot: (team, type, slotIndex) => {
    const draftState = activateDraftSlot(get().draftState, team, type, slotIndex);
    set({
      draftState,
      recommendation: generateRecommendation(draftState, get().disabledHeroes),
    });
  },

  confirmHeroSelection: (heroId) => {
    set({ isCalculating: true });
    const current = get();
    const draftState = confirmDraftHeroSelection(current.draftState, heroId);
    set({
      draftState,
      recommendation: generateRecommendation(draftState, current.disabledHeroes),
      isCalculating: false,
    });
  },

  closeModal: () => {
    const draftState = clearActiveSlot(get().draftState);
    set({
      draftState,
      recommendation: generateRecommendation(draftState, get().disabledHeroes),
    });
  },

  performAction: (heroId) => {
    get().confirmHeroSelection(heroId);
  },

  undoAction: () => {
    const draftState = undoDraftAction(get().draftState);
    set({
      draftState,
      recommendation: generateRecommendation(draftState, get().disabledHeroes),
    });
  },

  toggleDisabledHero: (heroId) => {
    const disabledHeroes = get().disabledHeroes.includes(heroId)
      ? get().disabledHeroes.filter((id) => id !== heroId)
      : [...get().disabledHeroes, heroId];

    set({
      disabledHeroes,
      recommendation: generateRecommendation(get().draftState, disabledHeroes),
    });
  },

  syncHeroData: async () => {
    set({ isCalculating: true });
    try {
      const response = await fetch('/api/sync-heroes', { method: 'POST' });
      const result = (await response.json()) as { version?: string; heroes?: Hero[] };
      const heroPool = result.heroes?.length ? result.heroes : get().heroPool;
      const draftState = initDraftState(heroPool);
      set({
        heroPool,
        draftState,
        dataVersion: result.version ?? get().dataVersion,
        lastSynced: new Date(),
        recommendation: generateRecommendation(draftState, get().disabledHeroes),
      });
    } finally {
      set({ isCalculating: false });
    }
  },
}));
