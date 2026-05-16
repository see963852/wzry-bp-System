# KOH Draft Advisor

## 本地啟動方法（Windows 11）

**方法一：雙擊一鍵啟動（推薦）**
1. 雙擊項目根目錄的 `start.bat`
2. 首次啟動會自動安裝依賴（約 1-2 分鐘）
3. 瀏覽器會自動開啟 http://localhost:3000

**方法二：命令行啟動**
```bash
npm install    # 首次需要
npm run dev    # 開發模式（http://localhost:3000）
```

**正式模式（更快速度）**
雙擊 `start-prod.bat`（首次會自動 Build）

## Vercel 線上部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/see963852/wzry-bp-System)

---

王者榮耀陣容智能克制推薦系統。系統模擬 Ban/Pick 流程，根據敵方已選、我方陣容缺口、機制克制與版本強度，即時計算推薦英雄與備選應對。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 本地開發

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000`。

## 數據更新

前端右上角同步按鈕會呼叫 `POST /api/sync-heroes`。同步流程為官方王者營地 API 優先、第三方網頁降級、全部失敗時回退本地 `src/data/heroData.ts` 快取。錯誤會記錄到 `data/fetch_errors.log`，此檔不提交 Git。

## 架構

```text
App Router UI
  ├─ Zustand Draft Store
  ├─ Draft Engine
  ├─ Recommendation Engine
  ├─ Counter Validator
  └─ Sync API Route
       ├─ Official API
       ├─ Fallback Web Fetch
       └─ Local Hero Cache
```

## 克制關係貢獻

修正 PR 請更新 `src/data/heroData.ts` 的 `countersTo` / `counteredBy`，並附上：

- 對位機制原因
- 近期版本或高分段數據來源
- 樣本量或社群共識依據

提交前執行：

```bash
npm run typecheck
npm run test
npm run build
```
