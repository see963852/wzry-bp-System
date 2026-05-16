'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Recommendation } from '@/types';
import { AlternativeTabs } from '@/components/AlternativeTabs';
import { CompositionGapChips } from '@/components/CompositionGapChips';
import { RecommendCard } from '@/components/RecommendCard';
import { ThreatRadar } from '@/components/ThreatRadar';

export function RecommendationPanel({ recommendation }: { recommendation: Recommendation | null }) {
  if (!recommendation) return null;

  return (
    <section className="recommendation-refresh rounded-md border border-white/10 bg-[#1a1d27] p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white">智能推薦</h2>
          <div className="text-sm text-zinc-400">{recommendation.mode === 'pick_now' ? '輪到我方操作' : '預測敵方選擇與應對'}</div>
        </div>
        <CompositionGapChips gaps={recommendation.compositionGaps} />
      </div>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={recommendation.generatedAt}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {recommendation.topPicks.slice(0, 3).map((score, index) => (
              <RecommendCard key={score.heroId} score={score} rank={index + 1} />
            ))}
          </div>
          <ThreatRadar threat={recommendation.threatAssessment} />
          <div className="xl:col-span-2">
            <AlternativeTabs plans={recommendation.enemyPredictions} />
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
