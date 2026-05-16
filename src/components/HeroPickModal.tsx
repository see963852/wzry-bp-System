'use client';

import { X } from 'lucide-react';
import type { HeroScore } from '@/types';

interface HeroPickModalProps {
  score: HeroScore | null;
  actionLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function HeroPickModal({ score, actionLabel, onConfirm, onClose }: HeroPickModalProps) {
  if (!score) return null;
  const { hero } = score;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-md border border-white/10 bg-[#1a1d27] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{hero.displayName}</h3>
            <p className="mt-1 text-sm text-zinc-400">{hero.summary}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="關閉">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {hero.mechanics.map((tag) => (
            <span key={tag} className="rounded bg-white/10 px-2 py-1 text-xs text-zinc-200">
              {tag}
            </span>
          ))}
        </div>
        <div className="mb-4 rounded-md bg-black/20 p-3">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-zinc-300">當前克制評分</span>
            <span className="font-bold text-emerald-400">{score.totalScore}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-white/10">
            <div className="h-full rounded bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500" style={{ width: `${score.totalScore}%` }} />
          </div>
        </div>
        <ul className="mb-5 space-y-1 text-sm text-zinc-300">
          {score.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button type="button" className="secondary-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="primary-button" onClick={onConfirm}>
            確認{actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
