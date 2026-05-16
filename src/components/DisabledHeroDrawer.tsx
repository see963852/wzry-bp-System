'use client';

import { Settings, X } from 'lucide-react';
import { useState } from 'react';
import { useDraftStore } from '@/store/draftStore';

export function DisabledHeroDrawer() {
  const [open, setOpen] = useState(false);
  const { heroPool, disabledHeroes, toggleDisabledHero } = useDraftStore();

  return (
    <>
      <button type="button" className="fixed bottom-5 right-5 z-40 rounded-full bg-blue-team p-4 text-white shadow-blue-glow" onClick={() => setOpen(true)} aria-label="設定不會玩英雄">
        <Settings size={22} />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/60">
          <aside className="ml-auto h-full w-full max-w-sm border-l border-white/10 bg-[#1a1d27] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">不會玩英雄</h2>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="關閉">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-8">
              {heroPool.map((hero) => (
                <button
                  key={hero.id}
                  type="button"
                  className={disabledHeroes.includes(hero.id) ? 'primary-pill justify-center' : 'secondary-pill justify-center'}
                  onClick={() => toggleDisabledHero(hero.id)}
                >
                  {hero.displayName}
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
