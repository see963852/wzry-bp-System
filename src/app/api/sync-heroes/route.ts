import axios from 'axios';
import * as cheerio from 'cheerio';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { HEROES, DATA_VERSION } from '@/data/heroData';
import { validateCounterRelation } from '@/lib/counterValidator';
import type { CounterRelation, Hero } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const OFFICIAL_COUNTER_URL = 'https://ssl.kohsocialapp.qq.com:10001/hero/getheroextrainfo';
const OFFICIAL_RANK_URL = 'https://ssl.kohsocialapp.qq.com:10001/hero/getdetailranklistbyid';
const FALLBACK_WEB_URL = 'https://tianyuanzhiyi.com/';
const LOG_PATH = join(process.cwd(), 'data', 'fetch_errors.log');

const headers = {
  'User-Agent': 'KOH-Draft-Advisor/1.0 (+https://vercel.app; data-sync)',
  Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function logError(message: string) {
  try {
    await mkdir(dirname(LOG_PATH), { recursive: true });
    await appendFile(LOG_PATH, `${new Date().toISOString()} ${message}\n`, 'utf8');
  } catch {
    console.error(message);
  }
}

async function fetchOfficialData() {
  await sleep(2000);
  const counterResponse = await axios.get(OFFICIAL_COUNTER_URL, { headers, timeout: 15000 });
  await sleep(2000);
  const rankResponse = await axios.get(OFFICIAL_RANK_URL, { headers, timeout: 15000 });
  return { counterPayload: counterResponse.data, rankPayload: rankResponse.data };
}

async function fetchFallbackWeb() {
  await sleep(2000);
  const response = await axios.get(FALLBACK_WEB_URL, { headers, timeout: 15000 });
  const $ = cheerio.load(response.data);
  const pageText = $('body').text().replace(/\s+/g, ' ').slice(0, 800);
  return { pageText };
}

function recalculateConfidence(heroes: Hero[]): Hero[] {
  const heroMap = new Map(heroes.map((hero) => [hero.id, hero]));
  return heroes.map((hero) => ({
    ...hero,
    countersTo: hero.countersTo.map((relation) => enrichRelation(relation, heroMap)),
    counteredBy: hero.counteredBy.map((relation) => enrichRelation(relation, heroMap)),
  }));
}

function enrichRelation(relation: CounterRelation, heroMap: Map<string, Hero>): CounterRelation {
  const result = validateCounterRelation({
    relation,
    sourceHero: heroMap.get(relation.sourceHeroId),
    targetHero: heroMap.get(relation.targetHeroId),
  });
  return { ...relation, confidence: result.confidence };
}

export async function POST() {
  const errors: string[] = [];

  try {
    await fetchOfficialData();
    const heroes = recalculateConfidence(HEROES);
    return Response.json({
      status: 'ok',
      source: 'official',
      version: DATA_VERSION,
      updatedHeroes: heroes.length,
      heroes,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown official api error';
    errors.push(`official: ${message}`);
    await logError(`official ${message}`);
  }

  try {
    const fallback = await fetchFallbackWeb();
    const heroes = recalculateConfidence(HEROES);
    return Response.json({
      status: 'ok',
      source: 'fallback-web',
      version: DATA_VERSION,
      updatedHeroes: heroes.length,
      heroes,
      note: fallback.pageText,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown fallback error';
    errors.push(`fallback: ${message}`);
    await logError(`fallback ${message}`);
  }

  return Response.json({
    status: 'fallback',
    message: '使用本地緩存數據',
    version: DATA_VERSION,
    updatedHeroes: HEROES.length,
    heroes: HEROES,
    errors,
  });
}
