'use client';

import { Moon, RotateCcw, Shield, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDraftStore } from '@/store/draftStore';
import { getCurrentTurnInfo } from '@/lib/draftEngine';
import { SyncButton } from '@/components/SyncButton';

export function Header() {
  const { draftState, dataVersion, undoAction } = useDraftStore();
  const [dark, setDark] = useState(true);
  const turn = getCurrentTurnInfo(draftState);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f1117]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-blue-team text-white shadow-blue-glow">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">KOH Draft Advisor</h1>
            <div className="text-xs text-zinc-400">王者榮耀陣容智能克制推薦系統</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200">{dataVersion}</span>
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200">{turn.phase}</span>
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200">{turn.label}</span>
          <button type="button" className="icon-button" onClick={undoAction} aria-label="撤銷">
            <RotateCcw size={18} />
          </button>
          <SyncButton />
          <button type="button" className="icon-button" onClick={() => setDark((value) => !value)} aria-label="切換深色模式">
            {dark ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
