import type { BanPickTurn, DraftAction, DraftActionType, DraftSlot, DraftState, Hero, Team } from '@/types';

const EMPTY_SLOTS = 5;

export const PICK_ORDER: Array<{ team: Team; slotIndex: number }> = [
  { team: 'blue', slotIndex: 0 },
  { team: 'red', slotIndex: 0 },
  { team: 'red', slotIndex: 1 },
  { team: 'blue', slotIndex: 1 },
  { team: 'blue', slotIndex: 2 },
  { team: 'red', slotIndex: 2 },
  { team: 'blue', slotIndex: 3 },
  { team: 'blue', slotIndex: 4 },
  { team: 'red', slotIndex: 3 },
  { team: 'red', slotIndex: 4 },
];

const createEmptySlots = () => Array<string | null>(EMPTY_SLOTS).fill(null);

const cloneState = (state: DraftState): DraftState => ({
  ...state,
  blueBans: [...state.blueBans],
  redBans: [...state.redBans],
  bluePicks: [...state.bluePicks],
  redPicks: [...state.redPicks],
  actionHistory: [...state.actionHistory],
  activeSlot: state.activeSlot ? { ...state.activeSlot } : null,
});

function getSlots(state: DraftState, team: Team, type: DraftActionType): Array<string | null> {
  if (team === 'blue' && type === 'ban') return state.blueBans;
  if (team === 'red' && type === 'ban') return state.redBans;
  if (team === 'blue' && type === 'pick') return state.bluePicks;
  return state.redPicks;
}

function setSlotValue(state: DraftState, slot: DraftSlot, heroId: string | null) {
  getSlots(state, slot.team, slot.type)[slot.slotIndex] = heroId;
}

function isValidSlotIndex(slotIndex: number) {
  return Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < EMPTY_SLOTS;
}

export function initDraftState(heroPool: Hero[]): DraftState {
  return {
    heroPool,
    blueBans: createEmptySlots(),
    redBans: createEmptySlots(),
    bluePicks: createEmptySlots(),
    redPicks: createEmptySlots(),
    phase: 'BAN_PHASE',
    pickTurnIndex: 0,
    actionHistory: [],
    isComplete: false,
    activeSlot: null,
  };
}

export function canAdvanceToPick(state: DraftState): boolean {
  return state.blueBans.every(Boolean) && state.redBans.every(Boolean);
}

export function getCurrentPickTurn(state: DraftState): { team: Team; slotIndex: number } | null {
  if (state.phase !== 'PICK_PHASE' || state.isComplete) return null;
  return PICK_ORDER[state.pickTurnIndex] ?? null;
}

export function isSlotClickable(state: DraftState, team: Team, type: DraftActionType, slotIndex: number): boolean {
  if (!isValidSlotIndex(slotIndex) || state.isComplete) return false;
  const slots = getSlots(state, team, type);
  if (slots[slotIndex] !== null) return false;

  if (state.phase === 'BAN_PHASE') {
    return type === 'ban';
  }

  if (state.phase === 'PICK_PHASE' && type === 'pick') {
    const turn = getCurrentPickTurn(state);
    return turn?.team === team && turn.slotIndex === slotIndex;
  }

  return false;
}

export function activateSlot(state: DraftState, team: Team, type: DraftActionType, slotIndex: number): DraftState {
  if (!isSlotClickable(state, team, type, slotIndex)) return state;
  return {
    ...cloneState(state),
    activeSlot: { team, type, slotIndex },
  };
}

export function clearActiveSlot(state: DraftState): DraftState {
  if (!state.activeSlot) return state;
  return {
    ...cloneState(state),
    activeSlot: null,
  };
}

export function getUsedHeroIds(state: DraftState): Set<string> {
  return new Set(
    [...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks].filter((heroId): heroId is string => Boolean(heroId)),
  );
}

export function isHeroAvailable(state: DraftState, heroId: string): boolean {
  return state.heroPool.some((hero) => hero.id === heroId) && !getUsedHeroIds(state).has(heroId);
}

export function isHeroSelectableForActiveSlot(state: DraftState, heroId: string, disabledHeroes: string[] = []): boolean {
  const activeSlot = state.activeSlot;
  if (!activeSlot || disabledHeroes.includes(heroId)) return false;
  if (!state.heroPool.some((hero) => hero.id === heroId)) return false;

  if (activeSlot.type === 'ban') {
    const ownBans = getSlots(state, activeSlot.team, 'ban');
    return !ownBans.includes(heroId);
  }

  return isHeroAvailable(state, heroId);
}

export function confirmHeroSelection(state: DraftState, heroId: string): DraftState {
  if (!state.activeSlot || state.isComplete) return state;
  const activeSlot = state.activeSlot;
  if (!isSlotClickable(state, activeSlot.team, activeSlot.type, activeSlot.slotIndex)) return clearActiveSlot(state);

  const nextState = cloneState(state);
  setSlotValue(nextState, activeSlot, heroId);

  const action: DraftAction = {
    turnIndex: nextState.actionHistory.length,
    team: activeSlot.team,
    type: activeSlot.type,
    slotIndex: activeSlot.slotIndex,
    heroId,
    phase: state.phase,
    pickTurnIndexBefore: state.pickTurnIndex,
    createdAt: new Date().toISOString(),
  };

  nextState.actionHistory.push(action);
  nextState.activeSlot = null;

  if (activeSlot.type === 'ban' && canAdvanceToPick(nextState)) {
    nextState.phase = 'PICK_PHASE';
    nextState.pickTurnIndex = 0;
  }

  if (activeSlot.type === 'pick') {
    nextState.pickTurnIndex += 1;
    if (nextState.pickTurnIndex >= PICK_ORDER.length) {
      nextState.phase = 'COMPLETE';
      nextState.isComplete = true;
      nextState.activeSlot = null;
    }
  }

  return nextState;
}

export function undoDraftAction(state: DraftState): DraftState {
  const lastAction = state.actionHistory.at(-1);
  if (!lastAction) return clearActiveSlot(state);

  const nextState = cloneState(state);
  setSlotValue(nextState, lastAction, null);
  nextState.actionHistory = nextState.actionHistory.slice(0, -1);
  nextState.activeSlot = null;
  nextState.isComplete = false;
  nextState.phase = lastAction.phase;
  nextState.pickTurnIndex = lastAction.pickTurnIndexBefore;

  if (lastAction.type === 'ban') {
    nextState.phase = 'BAN_PHASE';
    nextState.pickTurnIndex = 0;
  }

  return nextState;
}

export function getCurrentTurnInfo(state: DraftState): BanPickTurn {
  if (state.phase === 'BAN_PHASE') {
    return {
      index: state.actionHistory.length,
      team: 'blue',
      type: 'ban',
      phase: 'BAN_PHASE',
      slotIndex: state.blueBans.findIndex((heroId) => heroId === null),
      label: `Ban 階段：藍方 ${state.blueBans.filter(Boolean).length}/5，紅方 ${state.redBans.filter(Boolean).length}/5`,
    };
  }

  const pickTurn = getCurrentPickTurn(state);
  if (pickTurn) {
    return {
      index: state.actionHistory.length,
      team: pickTurn.team,
      type: 'pick',
      phase: 'PICK_PHASE',
      slotIndex: pickTurn.slotIndex,
      label: `${pickTurn.team === 'blue' ? '藍方' : '紅方'} Pick ${pickTurn.slotIndex + 1}`,
    };
  }

  return {
    index: state.actionHistory.length,
    team: 'blue',
    type: 'pick',
    phase: 'COMPLETE',
    slotIndex: -1,
    label: 'BP 已完成',
  };
}
