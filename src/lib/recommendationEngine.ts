import type {
  AlternativePlan,
  CompositionGap,
  CounterAnalysis,
  DraftState,
  Hero,
  HeroScore,
  MechanicTag,
  Recommendation,
  Role,
  Team,
  TeamCompletion,
  ThreatAssessment,
} from '@/types';
import { getCurrentPickTurn, isHeroAvailable } from '@/lib/draftEngine';
import { validateCounterRelation } from '@/lib/counterValidator';

const tierScore: Record<Hero['tier'], number> = { T0: 100, T1: 86, T2: 68, T3: 48 };

const ROLE_MAX: Record<Role, number> = {
  support: 1,
  marksman: 1,
  mage: 2,
  assassin: 2,
  tank: 2,
  fighter: 2,
};

const allRoles: Role[] = ['tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'];

const unique = <T>(items: T[]) => Array.from(new Set(items));

export function getHeroRoles(hero: Hero): Role[] {
  return hero.roles?.length ? hero.roles : [hero.role];
}

export function getHeroLanes(hero: Hero) {
  return hero.lanes?.length ? hero.lanes : [hero.lane];
}

export function getHeroesByIds(heroPool: Hero[], ids: Array<string | null>): Hero[] {
  const map = new Map(heroPool.map((hero) => [hero.id, hero]));
  return ids.flatMap((id) => {
    if (!id) return [];
    const hero = map.get(id);
    return hero ? [hero] : [];
  });
}

function countRoles(team: Hero[]): Map<Role, number> {
  const roleCounts = new Map<Role, number>();
  for (const hero of team) {
    for (const role of getHeroRoles(hero)) {
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
    }
  }
  return roleCounts;
}

export function analyzeTeamGaps(team: Hero[]): CompositionGap[] {
  const hasRole = (role: Role) => team.some((hero) => getHeroRoles(hero).includes(role));
  const gapSpecs: Array<{ id: string; label: string; expected: number; current: number; description: string }> = [
    {
      id: 'frontline',
      label: '前排',
      expected: 1,
      current: team.filter((hero) => getHeroRoles(hero).some((role) => role === 'tank' || role === 'fighter') || hero.mechanics.includes('shield') || hero.mechanics.includes('engage')).length,
      description: '承傷與視野佔位能力',
    },
    {
      id: 'control',
      label: '控制',
      expected: 2,
      current: team.filter((hero) => hero.mechanics.includes('hard_cc') || hero.mechanics.includes('soft_cc')).length,
      description: '先手、反手與留人能力',
    },
    {
      id: 'burst',
      label: '爆發',
      expected: 1,
      current: team.filter((hero) => hero.mechanics.includes('burst')).length,
      description: '秒殺與收割窗口',
    },
    {
      id: 'sustain',
      label: '治療',
      expected: 1,
      current: team.filter((hero) => hero.mechanics.includes('sustain')).length,
      description: '續航與拉扯能力',
    },
    {
      id: 'engage',
      label: '開團',
      expected: 1,
      current: team.filter((hero) => hero.mechanics.includes('engage')).length,
      description: '主動開戰能力',
    },
    {
      id: 'mobility',
      label: '機動',
      expected: 1,
      current: team.filter((hero) => hero.mechanics.includes('mobility')).length,
      description: '轉線、追擊與拉扯能力',
    },
    {
      id: 'core',
      label: '輸出核心',
      expected: 1,
      current: Number(hasRole('marksman') || hasRole('mage') || hasRole('assassin')),
      description: '穩定輸出或收割核心',
    },
  ];

  return gapSpecs.map((gap) => ({
    ...gap,
    status: gap.current < gap.expected ? 'danger' : gap.current > gap.expected + 1 ? 'muted' : 'success',
  }));
}

export function assessEnemyThreat(enemyTeam: Hero[], myTeam: Hero[]): ThreatAssessment {
  const scale = (value: number) => Math.min(100, Math.round((value / Math.max(1, enemyTeam.length)) * 100));
  const myFrontline = myTeam.filter((hero) => getHeroRoles(hero).some((role) => role === 'tank' || role === 'fighter')).length;

  return {
    burst: scale(enemyTeam.filter((hero) => hero.mechanics.includes('burst')).length / 0.65),
    control: scale(enemyTeam.filter((hero) => hero.mechanics.includes('hard_cc') || hero.mechanics.includes('soft_cc')).length / 0.8),
    durability: scale(enemyTeam.filter((hero) => getHeroRoles(hero).some((role) => role === 'tank' || role === 'fighter') || hero.mechanics.includes('shield')).length / 0.8),
    engage: scale(enemyTeam.filter((hero) => hero.mechanics.includes('engage')).length / 0.55),
    mobility: scale(enemyTeam.filter((hero) => hero.mechanics.includes('mobility') || hero.mechanics.includes('stealth')).length / 0.8),
    scaling: Math.min(100, Math.round(enemyTeam.reduce((sum, hero) => sum + (getHeroRoles(hero).includes('marksman') ? 22 : hero.tier === 'T0' ? 18 : 12), 0) + myFrontline * 4)),
  };
}

function scoreCounter(hero: Hero, enemyTeam: Hero[], heroPool: Hero[]): { score: number; reasons: string[] } {
  if (enemyTeam.length === 0) {
    return { score: 50, reasons: ['敵方尚未成形，優先選版本強勢與泛用英雄'] };
  }

  const heroMap = new Map(heroPool.map((item) => [item.id, item]));
  const matched = hero.countersTo.filter((relation) => enemyTeam.some((enemy) => enemy.id === relation.targetHeroId));
  if (matched.length === 0) {
    const softScore = enemyTeam.some((enemy) => enemy.counteredBy.some((relation) => relation.sourceHeroId === hero.id)) ? 66 : 48;
    return { score: softScore, reasons: softScore > 50 ? ['敵方弱點資料顯示可形成軟克制'] : ['暫無明確克制關係，依靠陣容與版本分補足'] };
  }

  const validated = matched.map((relation) =>
    validateCounterRelation({
      relation,
      sourceHero: hero,
      targetHero: heroMap.get(relation.targetHeroId),
    }),
  );
  const score = validated.reduce((sum, result) => sum + result.confidence, 0) / validated.length;
  return {
    score,
    reasons: matched.map((relation) => `${relation.targetHeroName}：${relation.mechanismReason}`),
  };
}

function scoreComposition(hero: Hero, myTeam: Hero[]): { score: number; reasons: string[] } {
  const gaps = analyzeTeamGaps(myTeam);
  const roleCounts = countRoles(myTeam);
  const reasons: string[] = [];
  let score = 50;

  for (const role of getHeroRoles(hero)) {
    const current = roleCounts.get(role) ?? 0;
    const max = ROLE_MAX[role] ?? 2;
    if (current >= max) {
      score -= role === 'support' || role === 'marksman' ? 28 : 16;
      reasons.push(`${role} 已達建議上限`);
    } else if (current === 0) {
      score += 8;
      reasons.push(`補足 ${role} 分工`);
    }
  }

  for (const gap of gaps.filter((item) => item.status === 'danger')) {
    const fills =
      (gap.id === 'frontline' && (getHeroRoles(hero).some((role) => role === 'tank' || role === 'fighter') || hero.mechanics.includes('shield'))) ||
      (gap.id === 'control' && (hero.mechanics.includes('hard_cc') || hero.mechanics.includes('soft_cc'))) ||
      (gap.id === 'burst' && hero.mechanics.includes('burst')) ||
      (gap.id === 'sustain' && hero.mechanics.includes('sustain')) ||
      (gap.id === 'engage' && hero.mechanics.includes('engage')) ||
      (gap.id === 'mobility' && hero.mechanics.includes('mobility')) ||
      (gap.id === 'core' && getHeroRoles(hero).some((role) => role === 'marksman' || role === 'mage' || role === 'assassin'));
    if (fills) {
      score += 12;
      reasons.push(`補足${gap.label}`);
    }
  }

  const synergyHits = myTeam.filter((ally) => hero.synergyWith.includes(ally.id) || ally.synergyWith.includes(hero.id));
  if (synergyHits.length > 0) {
    score += synergyHits.length * 8;
    reasons.push(`可配合 ${synergyHits.map((ally) => ally.displayName).join('、')}`);
  }

  return { score: Math.min(100, Math.max(0, score)), reasons };
}

function scoreMechanism(hero: Hero, enemyTeam: Hero[], myTeam: Hero[]): { score: number; reasons: string[] } {
  let score = 45;
  const reasons: string[] = [];
  if (hero.mechanics.includes('cleanse') && enemyTeam.some((enemy) => enemy.mechanics.includes('hard_cc') || enemy.mechanics.includes('soft_cc'))) {
    score += 24;
    reasons.push('解控可拆敵方控制鏈');
  }
  if (hero.mechanics.includes('true_damage') && enemyTeam.some((enemy) => enemy.mechanics.includes('shield') || getHeroRoles(enemy).includes('tank'))) {
    score += 25;
    reasons.push('真傷可處理護盾與前排');
  }
  if (hero.mechanics.includes('hard_cc') && enemyTeam.some((enemy) => enemy.mechanics.includes('mobility') || enemy.mechanics.includes('stealth'))) {
    score += 23;
    reasons.push('硬控限制高機動或隱身進場');
  }
  if (hero.mechanics.includes('poke') && enemyTeam.some((enemy) => enemy.mechanics.includes('engage'))) {
    score += 14;
    reasons.push('消耗能壓低強開前血線');
  }
  if (getHeroRoles(hero).every((role) => !myTeam.some((ally) => getHeroRoles(ally).includes(role)))) {
    score += 8;
    reasons.push('角色分工更完整');
  }
  return { score: Math.min(100, score), reasons };
}

export function scoreHeroForDraft(hero: Hero, myTeam: Hero[], enemyTeam: Hero[], heroPool: Hero[]): HeroScore {
  const counter = scoreCounter(hero, enemyTeam, heroPool);
  const composition = scoreComposition(hero, myTeam);
  const mechanism = scoreMechanism(hero, enemyTeam, myTeam);
  const metaScore = Math.min(100, tierScore[hero.tier] * 0.7 + hero.winRate * 100 * 0.3 + hero.pickRate * 70 + (hero.banRate ?? 0) * 35);
  const totalScore = counter.score * 0.35 + composition.score * 0.25 + mechanism.score * 0.25 + metaScore * 0.15;

  return {
    heroId: hero.id,
    hero,
    totalScore: Math.round(totalScore),
    counterScore: Math.round(counter.score),
    compositionScore: Math.round(composition.score),
    mechanismScore: Math.round(mechanism.score),
    metaScore: Math.round(metaScore),
    reasons: unique([...counter.reasons, ...composition.reasons, ...mechanism.reasons]).slice(0, 4),
  };
}

function buildCounterAnalysis(enemyTeam: Hero[], availableHeroes: Hero[], heroPool: Hero[]): CounterAnalysis[] {
  return enemyTeam.map((enemy) => {
    const scored = availableHeroes
      .map((hero) => scoreHeroForDraft(hero, [], [enemy], heroPool))
      .sort((a, b) => b.counterScore - a.counterScore)
      .slice(0, 3);
    return {
      enemyHeroId: enemy.id,
      enemyHeroName: enemy.displayName,
      bestCounterScore: scored[0]?.counterScore ?? 0,
      suggestedHeroIds: scored.map((item) => item.heroId),
      reasons: scored.flatMap((item) => item.reasons).slice(0, 3),
    };
  });
}

function buildTeamCompletion(myTeam: Hero[]): TeamCompletion {
  const gaps = analyzeTeamGaps(myTeam);
  const missingMechanics = gaps
    .filter((gap) => gap.status === 'danger')
    .map((gap) => {
      if (gap.id === 'control') return 'hard_cc';
      if (gap.id === 'burst') return 'burst';
      if (gap.id === 'sustain') return 'sustain';
      if (gap.id === 'engage') return 'engage';
      if (gap.id === 'mobility') return 'mobility';
      return 'shield';
    }) as MechanicTag[];

  const roles = unique(myTeam.flatMap((hero) => getHeroRoles(hero)));
  const missingRoles = allRoles.filter((role) => !roles.includes(role));
  const missingCompositionTags = unique(myTeam.flatMap((hero) => hero.compositionTags)).length < 2 ? ['teamfight' as const] : [];
  const completenessScore = Math.round((gaps.filter((gap) => gap.status !== 'danger').length / gaps.length) * 100);

  return {
    missingRoles,
    missingMechanics,
    missingCompositionTags,
    completenessScore,
    recommendationText: missingMechanics.length > 0 ? `優先補 ${missingMechanics.join('、')}` : '陣容骨架完整，可按克制與版本強度補位',
  };
}

function predictEnemyPlans(enemyTeam: Hero[], myTeam: Hero[], availableHeroes: Hero[], heroPool: Hero[]): AlternativePlan[] {
  const enemyCandidates = availableHeroes
    .map((hero) => scoreHeroForDraft(hero, enemyTeam, myTeam, heroPool))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);

  return enemyCandidates.map((candidate) => {
    const response = availableHeroes
      .filter((hero) => hero.id !== candidate.heroId)
      .map((hero) => scoreHeroForDraft(hero, myTeam, [...enemyTeam, candidate.hero], heroPool))
      .sort((a, b) => b.totalScore - a.totalScore)[0];

    return {
      predictedEnemyHeroId: candidate.heroId,
      predictedEnemyHeroName: candidate.hero.displayName,
      likelihoodScore: candidate.totalScore,
      responseHeroId: response?.heroId ?? candidate.heroId,
      responseHeroName: response?.hero.displayName ?? candidate.hero.displayName,
      reason: response?.reasons[0] ?? '依照版本強度與補位價值保留應對',
    };
  });
}

function filterByRoleLimit(availableHeroes: Hero[], myTeam: Hero[]): Hero[] {
  const myRoleCounts = countRoles(myTeam);
  const filteredHeroes = availableHeroes.filter((hero) =>
    getHeroRoles(hero).every((role) => {
      const max = ROLE_MAX[role] ?? 2;
      const current = myRoleCounts.get(role) ?? 0;
      return current < max;
    }),
  );
  return filteredHeroes.length > 0 ? filteredHeroes : availableHeroes;
}

export function generateRecommendation(state: DraftState, disabledHeroes: string[] = []): Recommendation {
  const pickTurn = getCurrentPickTurn(state);
  const activeTeam = state.activeSlot?.team ?? pickTurn?.team ?? 'blue';
  const forTeam: Team = activeTeam;
  const myTeam = getHeroesByIds(state.heroPool, forTeam === 'blue' ? state.bluePicks : state.redPicks);
  const enemyTeam = getHeroesByIds(state.heroPool, forTeam === 'blue' ? state.redPicks : state.bluePicks);
  const disabled = new Set(disabledHeroes);
  const availableHeroes = state.heroPool.filter((hero) => isHeroAvailable(state, hero.id) && !disabled.has(hero.id));
  const candidateHeroes = filterByRoleLimit(availableHeroes, myTeam);

  const topPicks = candidateHeroes
    .map((hero) => scoreHeroForDraft(hero, myTeam, enemyTeam, state.heroPool))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  return {
    forTeam,
    mode: pickTurn?.team === 'red' ? 'predict_enemy' : 'pick_now',
    topPicks,
    counterAnalysis: buildCounterAnalysis(enemyTeam, candidateHeroes, state.heroPool),
    teamCompletion: buildTeamCompletion(myTeam),
    compositionGaps: analyzeTeamGaps(myTeam),
    threatAssessment: assessEnemyThreat(enemyTeam, myTeam),
    enemyPredictions: pickTurn?.team === 'red' ? predictEnemyPlans(enemyTeam, myTeam, candidateHeroes, state.heroPool) : [],
    generatedAt: new Date().toISOString(),
  };
}
