'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BanPickTurn } from '@/types';

export function TurnIndicator({ turn }: { turn: BanPickTurn }) {
  const color = turn.team === 'blue' ? 'text-blue-team' : 'text-red-team';
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100">
      <motion.span animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        <ArrowRight className={color} size={18} />
      </motion.span>
      <span>{turn.label}</span>
    </div>
  );
}
