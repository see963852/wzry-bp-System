'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useDraftStore } from '@/store/draftStore';

export function SyncButton() {
  const { syncHeroData, isCalculating, lastSynced } = useDraftStore();
  const [message, setMessage] = useState('');

  async function handleSync() {
    setMessage('同步中');
    await syncHeroData();
    setMessage('已同步');
    window.setTimeout(() => setMessage(''), 2200);
  }

  return (
    <div className="relative">
      <button type="button" className="icon-button" onClick={handleSync} disabled={isCalculating} aria-label="同步英雄數據">
        <RefreshCw size={18} className={isCalculating ? 'animate-spin' : ''} />
      </button>
      {message ? (
        <div className="absolute right-0 top-11 z-40 w-44 rounded-md border border-white/10 bg-[#1a1d27] px-3 py-2 text-xs text-zinc-200 shadow-xl">
          {message}
          {lastSynced ? <div className="mt-1 text-zinc-500">{lastSynced.toLocaleTimeString()}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
