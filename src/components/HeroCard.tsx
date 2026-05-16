'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Hero } from '@/types';
import { getHeroLanes } from '@/lib/recommendationEngine';

interface HeroCardProps {
  hero: Hero;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const tierClass: Record<Hero['tier'], string> = {
  T0: 'bg-[#f6c90e] text-black',
  T1: 'bg-[#a8b2c1] text-black',
  T2: 'bg-sky-700 text-white',
  T3: 'bg-zinc-700 text-zinc-100',
};

const officialImageIds: Record<string, string> = {
  zhangfei: '171',
  lianpo: '105',
  sunce: '510',
  caocao: '128',
  libai: '131',
  hanxin: '150',
  'baili-shouyue-jungle': '196',
  lanlingwang: '153',
  'wang-zhaojun': '152',
  zhugeliang: '190',
  zhangliang: '156',
  diaochan: '141',
  'ganjiang-moye': '182',
  houyi: '169',
  'marco-polo': '132',
  'baili-shouyue-bot': '196',
  huangzhong: '192',
  gongsunli: '199',
  zhuangzhou: '113',
  caiwenji: '184',
  'niu-mo': '168',
  'ming-shiyin': '501',
  sunbin: '118',
  dianwei: '129',
  lvbu: '123',
  'zhong-wuyan': '117',
  guanyu: '140',
  athena: '183',
  ake: '116',
  sunwukong: '167',
};

function getHeroImageSrc(hero: Hero) {
  if (hero.imageUrl) return hero.imageUrl;
  if (/^\d+$/.test(hero.id)) return `https://game.gtimg.cn/images/yxzj/img201606/heroimg/${hero.id}/${hero.id}.jpg`;
  const officialId = officialImageIds[hero.id];
  return officialId
    ? `https://game.gtimg.cn/images/yxzj/img201606/heroimg/${officialId}/${officialId}.jpg`
    : '/heroes/placeholder.jpg';
}

export function HeroCard({ hero, disabled = false, selected = false, onClick }: HeroCardProps) {
  const [imageSrc, setImageSrc] = useState(getHeroImageSrc(hero));

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`hero-card group min-h-[118px] rounded-md border p-3 text-left transition ${
        selected ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 bg-[#1a1d27]'
      } ${disabled ? 'cursor-not-allowed opacity-35 grayscale' : 'hover:border-white/30 hover:bg-white/[0.06]'}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <Image
          src={imageSrc}
          alt={hero.displayName}
          width={60}
          height={60}
          className="size-[60px] rounded-md object-cover"
          onError={() => setImageSrc('/heroes/placeholder.jpg')}
        />
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${tierClass[hero.tier]}`}>{hero.tier}</span>
      </div>
      <div className="truncate text-sm font-semibold text-white">{hero.displayName}</div>
      <div className="mt-1 text-xs text-zinc-400">
        {getHeroLanes(hero).join('/')} · 勝率 {(hero.winRate * 100).toFixed(1)}%
      </div>
    </button>
  );
}
