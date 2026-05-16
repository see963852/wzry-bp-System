import { HEROES } from '@/data/heroData';
import { DRAFT_TURNS, executeDraftAction, getCurrentTurnInfo, initDraftState, isHeroAvailable, undoDraftAction } from '@/lib/draftEngine';

describe('draftEngine', () => {
  test('初始化 DraftState 正確設置第一個操作為藍方 Ban', () => {
    const state = initDraftState(HEROES);
    const turn = getCurrentTurnInfo(state);
    expect(turn.team).toBe('blue');
    expect(turn.type).toBe('ban');
    expect(turn.phase).toBe('BAN_PHASE_1');
  });

  test('Ban Phase 1 按正確順序輪換（藍→紅→藍→紅→藍→紅）', () => {
    expect(DRAFT_TURNS.slice(0, 6).map((turn) => turn.team)).toEqual(['blue', 'red', 'blue', 'red', 'blue', 'red']);
    expect(DRAFT_TURNS.slice(0, 6).every((turn) => turn.type === 'ban')).toBe(true);
  });

  test('Pick Phase 按正確順序輪換（藍→紅→紅→藍→藍→...）', () => {
    expect(DRAFT_TURNS.slice(6, 11).map((turn) => turn.team)).toEqual(['blue', 'red', 'red', 'blue', 'blue']);
    expect(DRAFT_TURNS.slice(15, 20).map((turn) => turn.team)).toEqual(['red', 'blue', 'blue', 'red', 'red']);
  });

  test('Ban Phase 2 在正確位置插入', () => {
    expect(DRAFT_TURNS.slice(11, 15).map((turn) => `${turn.team}-${turn.type}-${turn.phase}`)).toEqual([
      'blue-ban-BAN_PHASE_2',
      'red-ban-BAN_PHASE_2',
      'blue-ban-BAN_PHASE_2',
      'red-ban-BAN_PHASE_2',
    ]);
  });

  test('已 ban 英雄不出現在可選池', () => {
    const state = executeDraftAction(initDraftState(HEROES), HEROES[0].id);
    expect(isHeroAvailable(state, HEROES[0].id)).toBe(false);
  });

  test('已選英雄不出現在可選池', () => {
    let state = initDraftState(HEROES);
    for (let index = 0; index < 6; index += 1) {
      state = executeDraftAction(state, HEROES[index].id);
    }
    state = executeDraftAction(state, HEROES[6].id);
    expect(isHeroAvailable(state, HEROES[6].id)).toBe(false);
  });

  test('Undo 正確還原上一個操作', () => {
    const firstHero = HEROES[0].id;
    const state = executeDraftAction(initDraftState(HEROES), firstHero);
    const undone = undoDraftAction(state);
    expect(undone.blueBans).toEqual([]);
    expect(undone.currentTurnIndex).toBe(0);
    expect(isHeroAvailable(undone, firstHero)).toBe(true);
  });

  test('完整模擬一場 Draft（10 ban + 10 pick）狀態流轉正確', () => {
    let state = initDraftState(HEROES);
    for (let index = 0; index < 20; index += 1) {
      state = executeDraftAction(state, HEROES[index].id);
    }
    expect(state.isComplete).toBe(true);
    expect(state.blueBans).toHaveLength(5);
    expect(state.redBans).toHaveLength(5);
    expect(state.bluePicks).toHaveLength(5);
    expect(state.redPicks).toHaveLength(5);
    expect(state.actionHistory).toHaveLength(20);
  });
});
