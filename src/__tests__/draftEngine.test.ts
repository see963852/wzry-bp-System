import { HEROES } from '@/data/heroData';
import {
  activateSlot,
  canAdvanceToPick,
  confirmHeroSelection,
  getCurrentPickTurn,
  getUsedHeroIds,
  initDraftState,
  isSlotClickable,
  PICK_ORDER,
  undoDraftAction,
} from '@/lib/draftEngine';

describe('draftEngine', () => {
  test('初始化 DraftState 建立固定 5 格 ban/pick', () => {
    const state = initDraftState(HEROES);
    expect(state.phase).toBe('BAN_PHASE');
    expect(state.blueBans).toEqual([null, null, null, null, null]);
    expect(state.redBans).toEqual([null, null, null, null, null]);
    expect(state.bluePicks).toEqual([null, null, null, null, null]);
    expect(state.redPicks).toEqual([null, null, null, null, null]);
  });

  test('Ban 階段任意未填 ban 格可點擊，且雙方可 ban 同英雄', () => {
    let state = initDraftState(HEROES);
    expect(isSlotClickable(state, 'red', 'ban', 4)).toBe(true);
    state = activateSlot(state, 'blue', 'ban', 0);
    state = confirmHeroSelection(state, HEROES[0].id);
    state = activateSlot(state, 'red', 'ban', 0);
    state = confirmHeroSelection(state, HEROES[0].id);
    expect(state.blueBans[0]).toBe(HEROES[0].id);
    expect(state.redBans[0]).toBe(HEROES[0].id);
  });

  test('10 個 ban 格填滿後進入 Pick 階段', () => {
    let state = initDraftState(HEROES);
    for (let index = 0; index < 5; index += 1) {
      state = confirmHeroSelection(activateSlot(state, 'blue', 'ban', index), HEROES[index].id);
      state = confirmHeroSelection(activateSlot(state, 'red', 'ban', index), HEROES[index + 5].id);
    }
    expect(canAdvanceToPick(state)).toBe(true);
    expect(state.phase).toBe('PICK_PHASE');
    expect(getCurrentPickTurn(state)).toEqual(PICK_ORDER[0]);
  });

  test('Pick 階段只能點擊當前輪到的格子', () => {
    let state = initDraftState(HEROES);
    for (let index = 0; index < 5; index += 1) {
      state = confirmHeroSelection(activateSlot(state, 'blue', 'ban', index), HEROES[index].id);
      state = confirmHeroSelection(activateSlot(state, 'red', 'ban', index), HEROES[index + 5].id);
    }
    expect(isSlotClickable(state, 'blue', 'pick', 0)).toBe(true);
    expect(isSlotClickable(state, 'red', 'pick', 0)).toBe(false);
  });

  test('Undo 正確還原上一個操作', () => {
    let state = initDraftState(HEROES);
    state = confirmHeroSelection(activateSlot(state, 'blue', 'ban', 0), HEROES[0].id);
    const undone = undoDraftAction(state);
    expect(undone.blueBans[0]).toBeNull();
    expect(undone.actionHistory).toHaveLength(0);
  });

  test('完整模擬一場排位 BP 狀態流轉正確', () => {
    let state = initDraftState(HEROES);
    for (let index = 0; index < 5; index += 1) {
      state = confirmHeroSelection(activateSlot(state, 'blue', 'ban', index), HEROES[index].id);
      state = confirmHeroSelection(activateSlot(state, 'red', 'ban', index), HEROES[index + 5].id);
    }
    for (let index = 0; index < PICK_ORDER.length; index += 1) {
      const turn = getCurrentPickTurn(state);
      expect(turn).toEqual(PICK_ORDER[index]);
      state = confirmHeroSelection(activateSlot(state, turn!.team, 'pick', turn!.slotIndex), HEROES[index + 10].id);
    }
    expect(state.isComplete).toBe(true);
    expect(getUsedHeroIds(state).size).toBe(20);
  });
});
