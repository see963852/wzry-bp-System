import type {
  CounterRelation,
  CounterValidationInput,
  CounterValidationResult,
  Hero,
  MechanicTag,
  Role,
} from '@/types';

const MECHANIC_COUNTER_MATRIX: Record<MechanicTag, Array<MechanicTag | Role>> = {
  true_damage: ['shield'],
  disarm: ['marksman'],
  hard_cc: ['stealth', 'mobility'],
  cleanse: ['hard_cc', 'soft_cc'],
  burst: ['sustain'],
  poke: ['engage'],
  invincible: ['burst'],
  soft_cc: [],
  sustain: [],
  engage: [],
  stealth: [],
  mobility: [],
  shield: [],
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function scoreMechanismLayer(sourceHero?: Hero, targetHero?: Hero, relation?: CounterRelation): number {
  if (!sourceHero || !targetHero) {
    return relation?.mechanicsMatched?.length ? 80 : Math.min(100, relation?.confidence ?? 0);
  }

  const targetTokens = new Set<string>([targetHero.role, ...targetHero.mechanics]);
  const hitCount = sourceHero.mechanics.reduce((count, mechanic) => {
    const targets = MECHANIC_COUNTER_MATRIX[mechanic] ?? [];
    return count + (targets.some((target) => targetTokens.has(target)) ? 1 : 0);
  }, 0);

  if (hitCount === 0) {
    return Math.max(0, (relation?.confidence ?? 50) - 30);
  }

  return clamp(60 + hitCount * 20);
}

export function scoreDataLayer(relation: CounterRelation): number {
  const matchupScore = relation.matchupWinRate === undefined
    ? 50
    : relation.matchupWinRate > 0.53
      ? 100
      : relation.matchupWinRate > 0.51
        ? 70
        : 35;

  const sampleScore = relation.sampleSize === undefined
    ? 50
    : relation.sampleSize >= 10000
      ? 100
      : relation.sampleSize >= 5000
        ? 60
        : relation.sampleSize < 1000
          ? 0
          : 35;

  return clamp(matchupScore * 0.65 + sampleScore * 0.35);
}

export function scoreProfessionalLayer(relation: CounterRelation): number {
  const pickScore = relation.kplPickRate === undefined ? 45 : relation.kplPickRate > 0.3 ? 85 : relation.kplPickRate * 200;
  const winScore = relation.kplWinRate === undefined ? 45 : relation.kplWinRate > 0.55 ? 100 : relation.kplWinRate > 0.5 ? 65 : 35;
  return clamp(pickScore * 0.45 + winScore * 0.55);
}

export function scoreCommunityLayer(relation: CounterRelation): number {
  if (relation.communityApproval === undefined) {
    return 50;
  }
  return clamp(relation.communityApproval > 80 ? 100 : relation.communityApproval);
}

export function validateCounterRelation(input: CounterValidationInput): CounterValidationResult {
  const mechanism = scoreMechanismLayer(input.sourceHero, input.targetHero, input.relation);
  const data = scoreDataLayer(input.relation);
  const professional = scoreProfessionalLayer(input.relation);
  const community = scoreCommunityLayer(input.relation);
  const confidence = clamp(mechanism * 0.4 + data * 0.3 + professional * 0.2 + community * 0.1);

  const status = confidence >= 70 ? 'recommended' : confidence >= 60 ? 'pending' : 'excluded';
  const reasons = [
    `機制層 ${Math.round(mechanism)} 分`,
    `數據層 ${Math.round(data)} 分`,
    `賽場層 ${Math.round(professional)} 分`,
    `共識層 ${Math.round(community)} 分`,
  ];

  return {
    confidence: Math.round(confidence),
    status,
    layers: {
      mechanism: Math.round(mechanism),
      data: Math.round(data),
      professional: Math.round(professional),
      community: Math.round(community),
    },
    reasons,
  };
}

export function filterValidatedCounters(relations: CounterRelation[], heroes: Hero[]): CounterRelation[] {
  const heroMap = new Map(heroes.map((hero) => [hero.id, hero]));
  return relations.filter((relation) => {
    const result = validateCounterRelation({
      relation,
      sourceHero: heroMap.get(relation.sourceHeroId),
      targetHero: heroMap.get(relation.targetHeroId),
    });
    return result.status === 'recommended';
  });
}
