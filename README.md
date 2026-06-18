# 台灣火車站互動地圖

探索台灣 168 個 TRA 車站，特別適合尋找冷門小站旅遊靈感。

**線上網址：** https://taiwan-train-map.vercel.app

---

## 功能

- 互動地圖：所有車站以圓點標示，大小依旅客量決定
- 路線顯示：主幹線（藍）/ 支線（橘）兩色區分
- 車站資訊欄：點擊車站後展開，含 Wikipedia 照片、描述、標籤、外部連結、收藏/到訪紀錄、個人筆記
- 搜尋欄：支援車站名稱搜尋與歷史紀錄（localStorage）
- 篩選面板：依路線、縣市、旅客量、類型、標籤、年代篩選
- 車程查詢：串接 TDX API 查詢班次，並在地圖上高亮顯示路線
- 隨機探索：隨機挑選低流量車站並飛到該站
- 收藏清單 / 足跡地圖 / 路線圖例（底部 Tab）
- 所有使用者資料存在 localStorage，不需後端

---

## 技術架構

### 前端框架
- **React 19** + **Vite 8**（開發與建置工具）
- **Tailwind CSS v4**（樣式，透過 @tailwindcss/vite plugin）
- **MapLibre GL JS v5**（WebGL 地圖渲染，比 Leaflet 縮放更滑順）

### 地圖
- 底圖：Stamen Terrain via Stadia Maps（raster tile）
- URL：`https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png`
- 飽和度調整透過 MapLibre raster layer paint 屬性（不用 CSS filter）
- 車站與路線以 GeoJSON Source + Circle/Line Layer 渲染
- 不使用 react-map-gl 包裝層（直接用 maplibregl.Map()，避免相容性問題）

### 資料
| 檔案 | 內容 |
|------|------|
| `src/data/stations.json` | 168 個車站資料（id、名稱、座標、路線、縣市、旅客量、標籤等） |
| `src/data/lines.js` | 路線顏色定義、LINE_PATHS 座標陣列、getRoutePath 函式 |
| `src/data/descriptions.js` | 168 個車站的繁體中文介紹文字 |

LINE_PATHS 座標格式為 `[lat, lng]`，轉 GeoJSON 時需換成 `[lng, lat]`。

### 外部 API
- **TDX API**（台灣交通部）：OAuth2 client credentials，查詢列車時刻
  - 金鑰存在 `.env`（不進 git）：`VITE_TDX_CLIENT_ID` / `VITE_TDX_CLIENT_SECRET`
  - 實作在 `src/api/tdx.js`
- **Wikipedia zh API**：抓車站照片（CORS 支援，不需 API key）
  - URL 格式：`https://zh.wikipedia.org/w/api.php?action=query&titles=車站名&prop=pageimages&pithumbsize=600&origin=*`
  - 實作在 `src/hooks/useStationPhoto.js`

---

## 專案結構

```
src/
├── App.jsx                  # 主狀態管理、面板互斥邏輯
├── index.css                # 全域樣式、Google Fonts、動畫
├── api/
│   └── tdx.js               # TDX OAuth2 + 班次查詢
├── components/
│   ├── MapView.jsx          # MapLibre GL 地圖（vanilla，非 react-map-gl）
│   ├── StationPanel.jsx     # 右側車站資訊欄
│   ├── FilterPanel.jsx      # 篩選面板
│   ├── SearchBar.jsx        # 搜尋欄 + 歷史紀錄
│   ├── TrainQuery.jsx       # 車程查詢面板
│   └── BottomBar.jsx        # 底部 Tab（收藏、足跡、圖例）
├── data/
│   ├── stations.json        # 168 車站資料
│   ├── lines.js             # 路線定義與座標
│   └── descriptions.js      # 車站介紹文字
└── hooks/
    ├── useLocalStorage.js   # localStorage React hook
    └── useStationPhoto.js   # Wikipedia 照片 hook
```

---

## 面板互斥邏輯

三個面板（車站資訊、篩選、車程查詢）同時只能開一個，邏輯集中在 `App.jsx`：
- 開車站資訊 → 關閉篩選 + 關閉車程查詢
- 開篩選 → 關閉車站資訊 + 關閉車程查詢
- 開車程查詢 → 關閉車站資訊 + 關閉篩選

---

## MapView 關鍵設計

直接使用 `maplibregl.Map()`，不透過 react-map-gl：

```jsx
// 初始化（只跑一次）
useEffect(() => {
  const map = new maplibregl.Map({ container, style, center, zoom })
  map.on('load', () => {
    // addSource / addLayer
  })
  return () => map.remove()
}, [])

// 資料更新（用 source.setData，不用 map.loaded()）
useEffect(() => {
  const src = map.getSource('stations')
  if (src) src.setData(stationsGeoJSON)  // 直接檢查 source 是否存在
}, [stationsGeoJSON])
```

> 注意：不能用 `map.loaded()` 判斷，flyTo 動畫期間載入圖磚時會回傳 false，導致資料更新卡住。

Click handler 用 `queryRenderedFeatures` 判斷點到車站還是空白處：
```js
map.on('click', (e) => {
  const features = map.queryRenderedFeatures(e.point, { layers: ['stations-layer'] })
  if (features.length > 0) { /* 選車站 */ }
  else { /* 關閉面板 */ }
})
```

---

## 本機開發

```bash
# 安裝相依套件
npm install

# 建立 .env 填入 TDX 金鑰
echo "VITE_TDX_CLIENT_ID=your_id" >> .env
echo "VITE_TDX_CLIENT_SECRET=your_secret" >> .env

# 啟動開發 server（localhost:5173）
npm run dev
```

---

## 部署

**平台：** Vercel（免費方案，自動 HTTPS + CDN）

**自動部署流程：**
```bash
git add .
git commit -m "說明改了什麼"
git push
# Vercel 自動偵測 push，約 1 分鐘完成部署
```

**手動部署：**
```bash
vercel --prod
```

**相關連結：**
- Vercel Dashboard：https://vercel.com/danny-chen1-1119/taiwan-train-map
- GitHub Repo：https://github.com/DannyChen112/taiwan-train-map

---

## 注意事項

- `.env` 含 TDX 金鑰，已加入 `.gitignore`，不會進 git
- `node_modules/` 佔 ~400MB，可刪除後用 `npm install` 重新產生
- LINE_PATHS 中 `縱貫線南` 屬於主幹線，需在 `TRUNK_LINES` Set 中明確列出
- 車站 GeoJSON features 沒有頂層 `id`，選取狀態透過 `properties.selected` 做 data-driven styling
