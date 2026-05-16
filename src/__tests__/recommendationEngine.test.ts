import { HEROES } from '@/data/heroData';
import { activateSlot, confirmHeroSelection, initDraftState } from '@/lib/draftEngine';
import { analyzeTeamGaps, generateRecommendation, scoreHeroForDraft } from '@/lib/recommendationEngine';

const hero = (name: string) => {
  const found = HEROES.find((item) => item.name === name || item.displayName === name);
  if (!found) throw new Error(`missing hero ${name}`);
  return found;
};

function enterPickPhase() {
  let state = initDraftState(HEROES);
  for (let index = 0; index < 5; index += 1) {
    state = confirmHeroSelection(activateSlot(state, 'blue', 'ban', index), HEROES[index].id);
    state = confirmHeroSelection(activateSlot(state, 'red', 'ban', index), HEROES[index + 5].id);
  }
  return state;
}

describe('recommendationEngine', () => {
  test('藍方空陣容時推薦 T0 英雄', () => {
    const recommendation = generateRecommendation(enterPickPhase());
    expect(recommendation.topPicks.some((item) => item.hero.tier === 'T0')).toBe(true);
  });

  test('陣容缺口檢測正確識別缺少前排', () => {
    const gaps = analyzeTeamGaps([hero('干将莫邪'), hero('后羿')]);
    expect(gaps.find((gap) => gap.id === 'frontline')?.status).toBe('danger');
  });

  test('克制評分正確計算（呂布 vs 張飛陣容）', () => {
    const score = scoreHeroForDraft(hero('吕布'), [], [hero('张飞')], HEROES);
    expect(score.counterScore).toBeGreaterThanOrEqual(70);
    expect(score.reasons.join('')).toMatch(/真[傷伤]/);
  });

  test('禁用英雄不出現在推薦結果中', () => {
    const recommendation = generateRecommendation(enterPickPhase(), ['sunbin', 'gongsunli']);
    expect(recommendation.topPicks.map((item) => item.heroId)).not.toContain('sunbin');
    expect(recommendation.topPicks.map((item) => item.heroId)).not.toContain('gongsunli');
  });

  test('情境 B 正確預測紅方候選並輸出應對預案', () => {
    let state = enterPickPhase();
    state = confirmHeroSelection(activateSlot(state, 'blue', 'pick', 0), HEROES[10].id);
    const recommendation = generateRecommendation(state);
    expect(recommendation.mode).toBe('predict_enemy');
    expect(recommendation.enemyPredictions.length).toBeGreaterThan(0);
    expect(recommendation.enemyPredictions[0].responseHeroId).toBeTruthy();
  });
});
