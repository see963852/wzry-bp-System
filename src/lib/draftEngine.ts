import type { BanPickTurn, DraftAction, DraftState, Hero, Phase } from '@/types';

export const DRAFT_TURNS: BanPickTurn[] = [
  { index: 0, team: 'blue', type: 'ban', phase: 'BAN_PHASE_1', label: '藍方 Ban 1' },
  { index: 1, team: 'red', type: 'ban', phase: 'BAN_PHASE_1', label: '紅方 Ban 1' },
  { index: 2, team: 'blue', type: 'ban', phase: 'BAN_PHASE_1', label: '藍方 Ban 2' },
  { index: 3, team: 'red', type: 'ban', phase: 'BAN_PHASE_1', label: '紅方 Ban 2' },
  { index: 4, team: 'blue', type: 'ban', phase: 'BAN_PHASE_1', label: '藍方 Ban 3' },
  { index: 5, team: 'red', type: 'ban', phase: 'BAN_PHASE_1', label: '紅方 Ban 3' },
  { index: 6, team: 'blue', type: 'pick', phase: 'PICK_PHASE', label: '藍方 Pick 1' },
  { index: 7, team: 'red', type: 'pick', phase: 'PICK_PHASE', label: '紅方 Pick 1' },
  { index: 8, team: 'red', type: 'pick', phase: 'PICK_PHASE', label: '紅方 Pick 2' },
  { index: 9, team: 'blue', type: 'pick', phase: 'PICK_PHASE', label: '藍方 Pick 2' },
  { index: 10, team: 'blue', type: 'pick', phase: 'PICK_PHASE', label: '藍方 Pick 3' },
  { index: 11, team: 'blue', type: 'ban', phase: 'BAN_PHASE_2', label: '藍方 Ban 4' },
  { index: 12, team: 'red', type: 'ban', phase: 'BAN_PHASE_2', label: '紅方 Ban 4' },
  { index: 13, team: 'blue', type: 'ban', phase: 'BAN_PHASE_2', label: '藍方 Ban 5' },
  { index: 14, team: 'red', type: 'ban', phase: 'BAN_PHASE_2', label: '紅方 Ban 5' },
  { index: 15, team: 'red', type: 'pick', phase: 'PICK_PHASE', label: '紅方 Pick 3' },
  { index: 16, team: 'blue', type: 'pick', phase: 'PICK_PHASE', label: '藍方 Pick 4' },
  { index: 17, team: 'blue', type: 'pick', phase: 'PICK_PHASE', label: '藍方 Pick 5' },
  { index: 18, team: 'red', type: 'pick', phase: 'PICK_PHASE', label: '紅方 Pick 4' },
  { index: 19, team: 'red', type: 'pick', phase: 'PICK_PHASE', label: '紅方 Pick 5' },
];

const completeTurn: BanPickTurn = {
  index: DRAFT_TURNS.length,
  team: 'blue',
  type: 'pick',
  phase: 'COMPLETE',
  label: 'BP 已完成',
};

function derivePhase(currentTurnIndex: number): Phase {
  return DRAFT_TURNS[currentTurnIndex]?.phase ?? 'COMPLETE';
}

export function initDraftState(heroPool: Hero[]): DraftState {
  return {
    heroPool,
    blueBans: [],
    redBans: [],
    bluePicks: [],
    redPicks: [],
    actionHistory: [],
    currentTurnIndex: 0,
    phase: 'BAN_PHASE_1',
    isComplete: false,
  };
}

export function getCurrentTurnInfo(state: DraftState): BanPickTurn {
  return DRAFT_TURNS[state.currentTurnIndex] ?? completeTurn;
}

export function isHeroAvailable(state: DraftState, heroId: string): boolean {
  const used = new Set([...state.blueBans, ...state.redBans, ...state.bluePicks, ...state.redPicks]);
  return state.heroPool.some((hero) => hero.id === heroId) && !used.has(heroId);
}

export function executeDraftAction(state: DraftState, heroId: string): DraftState {
  const turn = getCurrentTurnInfo(state);
  if (turn.phase === 'COMPLETE' || state.isComplete) {
    return state;
  }
  if (!isHeroAvailable(state, heroId)) {
    return state;
  }

  const nextState: DraftState = {
    ...state,
    blueBans: [...state.blueBans],
    redBans: [...state.redBans],
    bluePicks: [...state.bluePicks],
    redPicks: [...state.redPicks],
    actionHistory: [...state.actionHistory],
  };

  if (turn.type === 'ban') {
    if (turn.team === 'blue') {
      nextState.blueBans.push(heroId);
    } else {
      nextState.redBans.push(heroId);
    }
  } else if (turn.team === 'blue') {
    nextState.bluePicks.push(heroId);
  } else {
    nextState.redPicks.push(heroId);
  }

  const action: DraftAction = {
    turnIndex: turn.index,
    team: turn.team,
    type: turn.type,
    heroId,
    phase: turn.phase,
    createdAt: new Date().toISOString(),
  };
  nextState.actionHistory.push(action);
  nextState.currentTurnIndex = Math.min(state.currentTurnIndex + 1, DRAFT_TURNS.length);
  nextState.phase = derivePhase(nextState.currentTurnIndex);
  nextState.isComplete = nextState.currentTurnIndex >= DRAFT_TURNS.length;
  return nextState;
}

export function undoDraftAction(state: DraftState): DraftState {
  const lastAction = state.actionHistory.at(-1);
  if (!lastAction) {
    return state;
  }

  const removeLast = (items: string[]) => items.slice(0, -1);
  const nextTurnIndex = Math.max(0, state.currentTurnIndex - 1);
  const nextState: DraftState = {
    ...state,
    blueBans: [...state.blueBans],
    redBans: [...state.redBans],
    bluePicks: [...state.bluePicks],
    redPicks: [...state.redPicks],
    actionHistory: state.actionHistory.slice(0, -1),
    currentTurnIndex: nextTurnIndex,
    phase: derivePhase(nextTurnIndex),
    isComplete: false,
  };

  if (lastAction.type === 'ban' && lastAction.team === 'blue') nextState.blueBans = removeLast(nextState.blueBans);
  if (lastAction.type === 'ban' && lastAction.team === 'red') nextState.redBans = removeLast(nextState.redBans);
  if (lastAction.type === 'pick' && lastAction.team === 'blue') nextState.bluePicks = removeLast(nextState.bluePicks);
  if (lastAction.type === 'pick' && lastAction.team === 'red') nextState.redPicks = removeLast(nextState.redPicks);

  return nextState;
}
