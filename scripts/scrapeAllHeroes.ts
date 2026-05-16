import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import type { CompositionTag, CounterRelation, Hero, Lane, MechanicTag, Role } from '../src/types';

interface OfficialHeroListItem {
  ename: number;
  cname: string;
  title: string;
  roles?: string[];
  skin_name: string;
  moss_id: number;
  hero_type?: number;
  hero_type2?: number;
}

const HERO_LIST_URL = 'https://pvp.qq.com/web201605/js/herolist.json';
const HERO_DETAIL_URL = 'https://pvp.qq.com/web201605/herodetail';
const HERO_IMAGE_URL = 'https://game.gtimg.cn/images/yxzj/img201606/heroimg';
const COUNTER_API_URL = 'https://ssl.kohsocialapp.qq.com:10001/hero/getheroextrainfo';
const REQUEST_INTERVAL_MS = 1500;

const ROLE_MAP: Record<string, Role> = {
  坦克: 'tank',
  戰士: 'fighter',
  刺客: 'assassin',
  法師: 'mage',
  射手: 'marksman',
  輔助: 'support',
};

const NUMERIC_ROLE_MAP: Record<number, Role> = {
  1: 'tank',
  2: 'fighter',
  3: 'assassin',
  4: 'mage',
  5: 'marksman',
  6: 'support',
};

const ROLE_NAME_BY_NUMERIC: Record<number, string> = {
  1: '坦克',
  2: '戰士',
  3: '刺客',
  4: '法師',
  5: '射手',
  6: '輔助',
};

const headers = {
  'User-Agent': 'KOH-Draft-Advisor-Scraper/1.0 (+https://github.com/see963852/wzry-bp-System)',
  Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function normalizeRoles(item: OfficialHeroListItem): Role[] {
  const rawRoles = item.roles?.length
    ? item.roles
    : [item.hero_type, item.hero_type2].flatMap((roleId) => (roleId ? [ROLE_NAME_BY_NUMERIC[roleId]] : []));

  const roles = rawRoles
    .map((role) => ROLE_MAP[role])
    .filter((role): role is Role => Boolean(role));

  return roles.length ? Array.from(new Set(roles)) : ['fighter'];
}

function inferLanesFromRoles(rawRoles: string[] = []): Lane[] {
  const roles = rawRoles.map((role) => ROLE_MAP[role]).filter(Boolean);
  const lanes = new Set<Lane>();
  if (roles.includes('tank') || roles.includes('fighter')) lanes.add('top');
  if (roles.includes('assassin')) lanes.add('jungle');
  if (roles.includes('mage')) lanes.add('mid');
  if (roles.includes('marksman')) lanes.add('bot');
  if (roles.includes('support')) lanes.add('roam');
  if (lanes.size === 0) lanes.add('top');
  return Array.from(lanes);
}

function inferMechanicsFromRoles(rawRoles: string[] = []): MechanicTag[] {
  const mechanics = new Set<MechanicTag>();
  for (const role of rawRoles) {
    if (role === '坦克') {
      mechanics.add('hard_cc');
      mechanics.add('engage');
      mechanics.add('shield');
    }
    if (role === '戰士') {
      mechanics.add('engage');
      mechanics.add('sustain');
    }
    if (role === '刺客') {
      mechanics.add('burst');
      mechanics.add('mobility');
    }
    if (role === '法師') {
      mechanics.add('poke');
      mechanics.add('burst');
    }
    if (role === '射手') {
      mechanics.add('poke');
      mechanics.add('burst');
    }
    if (role === '輔助') {
      mechanics.add('soft_cc');
      mechanics.add('sustain');
    }
  }
  return mechanics.size ? Array.from(mechanics) : ['burst'];
}

function inferCompositionTags(rawRoles: string[] = []): CompositionTag[] {
  const tags = new Set<CompositionTag>();
  if (rawRoles.includes('坦克') || rawRoles.includes('輔助')) tags.add('protect');
  if (rawRoles.includes('戰士') || rawRoles.includes('刺客')) tags.add('dive');
  if (rawRoles.includes('法師') || rawRoles.includes('射手')) tags.add('poke');
  if (rawRoles.includes('射手')) tags.add('siege');
  if (tags.size === 0) tags.add('teamfight');
  return Array.from(tags);
}

async function fetchHeroList(): Promise<OfficialHeroListItem[]> {
  const response = await axios.get<OfficialHeroListItem[]>(HERO_LIST_URL, {
    headers,
    timeout: 20000,
    responseType: 'json',
  });
  return response.data.map((item) => ({
    ...item,
    title: item.title ?? '',
    skin_name: item.skin_name ?? '',
    moss_id: item.moss_id ?? item.ename,
    roles: item.roles ?? [item.hero_type, item.hero_type2].flatMap((roleId) => (roleId ? [ROLE_NAME_BY_NUMERIC[roleId]] : [])),
  }));
}

async function downloadHeroImage(ename: number, outputDir: string): Promise<string> {
  const outputPath = path.join(outputDir, `${ename}.jpg`);
  const imageUrl = `${HERO_IMAGE_URL}/${ename}/${ename}.jpg`;
  const response = await axios.get<ArrayBuffer>(imageUrl, {
    headers,
    timeout: 20000,
    responseType: 'arraybuffer',
  });
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return `/heroes/${ename}.jpg`;
}

async function fetchHeroDetail(ename: number): Promise<Partial<Hero>> {
  try {
    const response = await axios.get<string>(`${HERO_DETAIL_URL}/${ename}.shtml`, {
      headers,
      timeout: 20000,
    });
    const $ = cheerio.load(response.data);
    const summary =
      $('.hero-story p').first().text().trim() ||
      $('.pop-bd p').first().text().trim() ||
      $('meta[name="description"]').attr('content')?.trim() ||
      '';
    const skillText = $('.skill-desc, .show-list .skill-desc, .skill-info').text();
    const mechanics = inferMechanicsFromSkillText(skillText);
    return {
      summary,
      mechanics: mechanics.length ? mechanics : undefined,
    };
  } catch {
    return {};
  }
}

function inferMechanicsFromSkillText(text: string): MechanicTag[] {
  const mechanics = new Set<MechanicTag>();
  if (/眩晕|击飞|压制|定身|冰冻|石化|控制/.test(text)) mechanics.add('hard_cc');
  if (/减速|沉默|缴械/.test(text)) mechanics.add('soft_cc');
  if (/爆发|额外伤害|斩杀|暴击/.test(text)) mechanics.add('burst');
  if (/回复|治疗|生命值|吸血/.test(text)) mechanics.add('sustain');
  if (/突进|冲锋|位移|跳跃/.test(text)) mechanics.add('mobility');
  if (/护盾|免伤/.test(text)) mechanics.add('shield');
  if (/真实伤害/.test(text)) mechanics.add('true_damage');
  if (/隐身|伪装/.test(text)) mechanics.add('stealth');
  if (/无法选中|无敌/.test(text)) mechanics.add('invincible');
  return Array.from(mechanics);
}

async function fetchCounterData(ename: number): Promise<CounterRelation[]> {
  try {
    const response = await axios.get(COUNTER_API_URL, {
      headers,
      params: { hero_id: ename },
      timeout: 15000,
    });
    const payload = response.data;
    const records: Array<Record<string, unknown>> = Array.isArray(payload?.data?.counter) ? payload.data.counter : [];
    return records
      .map((item: Record<string, unknown>): CounterRelation | null => {
        const targetHeroId = String(item.targetHeroId ?? item.target_hero_id ?? item.hero_id ?? '');
        const targetHeroName = String(item.targetHeroName ?? item.target_hero_name ?? item.cname ?? '');
        if (!targetHeroId || !targetHeroName) return null;
        return {
          sourceHeroId: String(ename),
          targetHeroId,
          sourceHeroName: String(ename),
          targetHeroName,
          confidence: Number(item.confidence ?? 65),
          mechanismReason: String(item.reason ?? '官方接口克制關係'),
          matchupWinRate: Number(item.winRate ?? item.win_rate ?? 0.52),
          sampleSize: Number(item.sampleSize ?? item.sample_size ?? 0),
        };
      })
      .filter((item): item is CounterRelation => Boolean(item));
  } catch {
    return [];
  }
}

async function main() {
  const imagesOnly = process.argv.includes('--images-only');
  const heroList = await fetchHeroList();
  console.log(`[獲取] 共 ${heroList.length} 名英雄`);

  const imageDir = path.join(process.cwd(), 'public', 'heroes');
  if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

  const heroData: Hero[] = [];
  for (const item of heroList) {
    await sleep(REQUEST_INTERVAL_MS);
    const rawRoles = item.roles ?? [];
    const roles = normalizeRoles(item);
    const imagePath = await downloadHeroImage(item.ename, imageDir);

    if (!imagesOnly) {
      const [detail, countersTo] = await Promise.all([fetchHeroDetail(item.ename), fetchCounterData(item.ename)]);
      const lanes = inferLanesFromRoles(rawRoles);
      const hero: Hero = {
        id: String(item.ename),
        name: item.cname,
        displayName: item.cname,
        title: item.title,
        imageUrl: imagePath,
        role: roles[0],
        roles,
        lane: lanes[0],
        lanes,
        tier: 'T2',
        winRate: 0.5,
        pickRate: 0.05,
        banRate: 0.02,
        mechanics: detail.mechanics?.length ? detail.mechanics : inferMechanicsFromRoles(rawRoles),
        countersTo,
        counteredBy: [],
        synergyWith: [],
        compositionTags: inferCompositionTags(rawRoles),
        summary: detail.summary || `${item.title ? `${item.title}，` : ''}${roles.join('/')} 英雄。`,
      };
      heroData.push(hero);
    }

    console.log(`[完成] ${item.cname} (${item.ename})`);
  }

  if (imagesOnly) {
    console.log(`[輸出] 圖像已更新，共 ${heroList.length} 張`);
    return;
  }

  const outputPath = path.join(process.cwd(), 'src', 'data', 'heroData.ts');
  const content = [
    `// 自動生成 - ${new Date().toISOString()}`,
    `// 共 ${heroData.length} 名英雄`,
    `import type { CounterRelation, Hero } from '@/types';`,
    '',
    `export const DATA_VERSION = 'official-${new Date().toISOString().slice(0, 10)}';`,
    'export const EXTERNAL_COUNTER_RELATIONS: CounterRelation[] = [];',
    `export const HEROES: Hero[] = ${JSON.stringify(heroData, null, 2)};`,
    'export const heroData = HEROES;',
    '',
  ].join('\n');
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`[輸出] heroData.ts 已更新，共 ${heroData.length} 名英雄`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
