/** 英雄主要定位。 */
export type Role = 'tank' | 'fighter' | 'assassin' | 'mage' | 'marksman' | 'support';

/** 對局分路。 */
export type Lane = 'top' | 'jungle' | 'mid' | 'bot' | 'roam';

/** 技能與對抗機制標籤。 */
export type MechanicTag =
  | 'hard_cc'
  | 'soft_cc'
  | 'burst'
  | 'sustain'
  | 'engage'
  | 'poke'
  | 'stealth'
  | 'mobility'
  | 'true_damage'
  | 'shield'
  | 'disarm'
  | 'cleanse'
  | 'invincible';

/** 陣容風格標籤。 */
export type CompositionTag = 'teamfight' | 'poke' | 'split_push' | 'dive' | 'protect' | 'siege' | 'assassinate';

/** 排位賽 BP 階段。 */
export type Phase = 'BAN_PHASE' | 'PICK_PHASE' | 'COMPLETE';

/** BP 陣營。 */
export type Team = 'blue' | 'red';

/** 版本梯度。 */
export type Tier = 'T0' | 'T1' | 'T2' | 'T3';

/** BP 操作類型。 */
export type DraftActionType = 'ban' | 'pick';

/** 可互動格子描述。 */
export interface DraftSlot {
  /** 所屬陣營。 */
  team: Team;
  /** 格子類型。 */
  type: DraftActionType;
  /** 0-based 格子索引。 */
  slotIndex: number;
}

/** 缺口狀態，用於 UI chip 顯示。 */
export type GapStatus = 'danger' | 'success' | 'muted';

/** 推薦策略情境。 */
export type RecommendationMode = 'pick_now' | 'predict_enemy';

/** 單一英雄的靜態與版本數據。 */
export interface Hero {
  /** 穩定唯一 ID；官方爬蟲使用數字 ID 字串。 */
  id: string;
  /** 遊戲內英雄名稱。 */
  name: string;
  /** UI 顯示用名稱。 */
  displayName: string;
  /** 英雄稱號，官方爬蟲資料可填。 */
  title?: string;
  /** 本地或遠端頭像 URL。 */
  imageUrl?: string;
  /** 主要職業定位；保留以兼容現有靜態資料。 */
  role: Role;
  /** 多職業定位，官方資料可能包含兩個職業。 */
  roles?: Role[];
  /** 建議分路；保留以兼容現有靜態資料。 */
  lane: Lane;
  /** 可用分路集合。 */
  lanes?: Lane[];
  /** 版本梯度。 */
  tier: Tier;
  /** 高分段近似勝率，0 至 1。 */
  winRate: number;
  /** 高分段近似出場率，0 至 1。 */
  pickRate: number;
  /** 高分段近似禁用率，0 至 1。 */
  banRate?: number;
  /** 技能機制標籤。 */
  mechanics: MechanicTag[];
  /** 英雄擅長克制的目標關係。 */
  countersTo: CounterRelation[];
  /** 容易被克制的來源關係。 */
  counteredBy: CounterRelation[];
  /** 建議配合英雄 ID。 */
  synergyWith: string[];
  /** 陣容風格標籤。 */
  compositionTags: CompositionTag[];
  /** 文字摘要，用於確認彈窗與推薦原因。 */
  summary?: string;
}

/** 英雄克制關係。 */
export interface CounterRelation {
  /** 關係來源英雄 ID。 */
  sourceHeroId: string;
  /** 被克制英雄 ID。 */
  targetHeroId: string;
  /** 人類可讀來源英雄名。 */
  sourceHeroName: string;
  /** 人類可讀目標英雄名。 */
  targetHeroName: string;
  /** 可信度，0 至 100。 */
  confidence: number;
  /** 克制成立的主要機制原因。 */
  mechanismReason: string;
  /** 對位勝率，0 至 1。 */
  matchupWinRate?: number;
  /** 對局樣本量。 */
  sampleSize?: number;
  /** KPL counter pick 出場率，0 至 1。 */
  kplPickRate?: number;
  /** KPL 對應勝率，0 至 1。 */
  kplWinRate?: number;
  /** 社群認可度，0 至 100。 */
  communityApproval?: number;
  /** 命中的機制標籤。 */
  mechanicsMatched?: MechanicTag[];
}

/** 外部或本地數據來源描述。 */
export interface DataSource {
  /** 來源識別碼。 */
  id: string;
  /** 來源顯示名稱。 */
  name: string;
  /** 來源 URL。 */
  url: string;
  /** 來源優先級，數值越低越優先。 */
  priority: number;
  /** 是否為官方來源。 */
  official: boolean;
  /** 最後成功同步時間。 */
  lastSyncedAt?: string;
}

/** 完整排位賽 BP 狀態。 */
export interface DraftState {
  /** 可用英雄池。 */
  heroPool: Hero[];
  /** 藍方 ban 格，固定長度 5；null 代表空格。 */
  blueBans: Array<string | null>;
  /** 紅方 ban 格，固定長度 5；null 代表空格。 */
  redBans: Array<string | null>;
  /** 藍方 pick 格，固定長度 5；null 代表空格。 */
  bluePicks: Array<string | null>;
  /** 紅方 pick 格，固定長度 5；null 代表空格。 */
  redPicks: Array<string | null>;
  /** 當前階段。 */
  phase: Phase;
  /** Pick 階段輪次索引。 */
  pickTurnIndex: number;
  /** 已執行操作歷史。 */
  actionHistory: DraftAction[];
  /** 是否已完成全部 pick。 */
  isComplete: boolean;
  /** 使用者目前點擊並準備填入的格子。 */
  activeSlot: DraftSlot | null;
}

/** 單次 BP 操作。 */
export interface DraftAction {
  /** 操作順序索引。 */
  turnIndex: number;
  /** 操作陣營。 */
  team: Team;
  /** 操作類型。 */
  type: DraftActionType;
  /** 格子索引。 */
  slotIndex: number;
  /** 目標英雄 ID。 */
  heroId: string;
  /** 操作時所處階段。 */
  phase: Phase;
  /** 操作前 Pick 輪次索引。 */
  pickTurnIndexBefore: number;
  /** ISO 時間戳。 */
  createdAt: string;
}

/** 推薦引擎輸出。 */
export interface Recommendation {
  /** 推薦適用的陣營。 */
  forTeam: Team;
  /** 推薦模式。 */
  mode: RecommendationMode;
  /** 最佳可選英雄。 */
  topPicks: HeroScore[];
  /** 對敵方既有陣容的克制分析。 */
  counterAnalysis: CounterAnalysis[];
  /** 我方陣容補全建議。 */
  teamCompletion: TeamCompletion;
  /** 陣容缺口 chips。 */
  compositionGaps: CompositionGap[];
  /** 敵方威脅雷達圖數據。 */
  threatAssessment: ThreatAssessment;
  /** 若輪到敵方，預測敵方選擇與應對。 */
  enemyPredictions: AlternativePlan[];
  /** 生成時間。 */
  generatedAt: string;
}

/** 單一敵方英雄的克制分析。 */
export interface CounterAnalysis {
  /** 敵方英雄 ID。 */
  enemyHeroId: string;
  /** 敵方英雄名稱。 */
  enemyHeroName: string;
  /** 最高克制分。 */
  bestCounterScore: number;
  /** 建議克制英雄 ID。 */
  suggestedHeroIds: string[];
  /** 分析理由。 */
  reasons: string[];
}

/** 陣容補全摘要。 */
export interface TeamCompletion {
  /** 目前缺失角色。 */
  missingRoles: Role[];
  /** 目前缺失機制。 */
  missingMechanics: MechanicTag[];
  /** 目前缺失陣容風格。 */
  missingCompositionTags: CompositionTag[];
  /** 整體完整度，0 至 100。 */
  completenessScore: number;
  /** 可讀建議。 */
  recommendationText: string;
}

/** 陣容短板 chip。 */
export interface CompositionGap {
  /** 維度 ID。 */
  id: string;
  /** 顯示名稱。 */
  label: string;
  /** 目前數量。 */
  current: number;
  /** 建議數量。 */
  expected: number;
  /** UI 狀態。 */
  status: GapStatus;
  /** 補充說明。 */
  description: string;
}

/** 單一推薦英雄得分。 */
export interface HeroScore {
  /** 英雄 ID。 */
  heroId: string;
  /** 英雄資料。 */
  hero: Hero;
  /** 綜合分，0 至 100。 */
  totalScore: number;
  /** 克制分，0 至 100。 */
  counterScore: number;
  /** 陣容互補分，0 至 100。 */
  compositionScore: number;
  /** 機制壓制分，0 至 100。 */
  mechanismScore: number;
  /** 版本強度分，0 至 100。 */
  metaScore: number;
  /** 推薦理由。 */
  reasons: string[];
}

/** BP 階段設定。 */
export interface PhaseConfig {
  /** 階段名稱。 */
  phase: Phase;
  /** 階段包含回合索引。 */
  turnIndexes: number[];
  /** 階段說明。 */
  label: string;
  /** 是否為禁用階段。 */
  isBanPhase: boolean;
}

/** 當前回合資訊，保留給 Header/指示器使用。 */
export interface BanPickTurn {
  /** 回合索引。 */
  index: number;
  /** 操作陣營。 */
  team: Team;
  /** 操作類型。 */
  type: DraftActionType;
  /** 所屬階段。 */
  phase: Phase;
  /** 格子索引。 */
  slotIndex: number;
  /** 顯示文案。 */
  label: string;
}

/** 四層驗證輸入資料。 */
export interface CounterValidationInput {
  /** 待驗證克制關係。 */
  relation: CounterRelation;
  /** 來源英雄資料。 */
  sourceHero?: Hero;
  /** 目標英雄資料。 */
  targetHero?: Hero;
}

/** 四層驗證結果。 */
export interface CounterValidationResult {
  /** 最終可信度。 */
  confidence: number;
  /** 推薦分類。 */
  status: 'recommended' | 'pending' | 'excluded';
  /** 四層分數拆解。 */
  layers: {
    mechanism: number;
    data: number;
    professional: number;
    community: number;
  };
  /** 驗證理由。 */
  reasons: string[];
}

/** 六維敵方威脅評估。 */
export interface ThreatAssessment {
  /** 爆發力。 */
  burst: number;
  /** 控制力。 */
  control: number;
  /** 坦度。 */
  durability: number;
  /** 開團。 */
  engage: number;
  /** 機動性。 */
  mobility: number;
  /** 後期強度。 */
  scaling: number;
}

/** 敵方選擇預測與我方應對預案。 */
export interface AlternativePlan {
  /** 預測敵方英雄 ID。 */
  predictedEnemyHeroId: string;
  /** 預測敵方英雄名稱。 */
  predictedEnemyHeroName: string;
  /** 預測分數。 */
  likelihoodScore: number;
  /** 建議我方應對英雄 ID。 */
  responseHeroId: string;
  /** 建議我方應對英雄名稱。 */
  responseHeroName: string;
  /** 應對理由。 */
  reason: string;
}
