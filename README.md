# 三總牙周小教室網站

三軍總醫院牙周病科「三總牙周小教室」病人衛教影片網站。靜態網站，用 GitHub Pages 發布。

網址：https://orz629.github.io/perio-classroom-site/

## 怎麼更新

```
npm install      # 第一次才需要（產生 QR code 用）
node build.js    # 讀 data/*.json → 產生 docs/
```

改完後把 `docs/` 一起 commit、推上 main，GitHub Pages 會自動更新（約一到兩分鐘）。

## 檔案

| 位置 | 內容 |
|---|---|
| `data/site.json` | 站名、正式網址（`baseUrl`，QR code 與分享預覽圖用）、免責聲明、製作與版權標示 |
| `data/categories.json` | 六個主題分類 |
| `data/journey.json` | 首頁「您現在是哪一種情況？」六個入口 |
| `data/episodes.json` | 每集一筆 |
| `src/style.css` | 樣式（色票沿用影片） |
| `assets/` | 院徽、各集封面縮圖（封面 a 吉祥物版，縮成 1280 寬） |
| `build.js` | 產生器 |
| `docs/` | 產生出來的網站（GitHub Pages 發布這個資料夾，不要手改） |

## 新增一集

1. 封面：把 perio-classroom 該集 `thumbnail/封面_a.jpg` 縮成 1280×720，存成 `assets/thumbs/<id>.jpg`。
2. 在 `data/episodes.json` 加一筆（或把原本 `planned` 那筆改掉）：

| 欄位 | 說明 |
|---|---|
| `id`、`no`、`title` | 網址代號、集數（兩位數字，頁面顯示「第五集」）、網站上的短標題 |
| `ytTitle` | YouTube 標題（備查） |
| `status` | `published` 已上架；`planned` 規劃中（只顯示灰卡，不產生影片頁） |
| `category` / `alsoIn` | 主分類／同時出現在哪些分類 |
| `journey` | 出現在哪些「情況」入口（依 episodes.json 順序排列） |
| `youtubeId` | YouTube 影片代號（youtu.be/ 後面那串） |
| `duration` | 片長，國字 |
| `summary`、`keyPoints` | 摘要與三個重點，取自該集 YouTube 上架素材的說明欄 |
| `tip` | 額外提醒（選填，例如第五集的「看牙那天」） |
| `related` | 「接著看」的影片 id |
| `handout` | 可列印單張 PDF 路徑（選填；空白就不顯示） |
| `reviewed` | 最後審閱日期（選填；空白就不顯示） |
| `references` | 參考文獻，取自該集 01 內容審查報告；`pmid` 或 `url` |

3. `node build.js`，檢查後 commit、推上去。

## 版權

目前頁尾與 YouTube 說明欄一致，標示「© 2026 三軍總醫院牙周病科」。著作授權同意書簽署後，改 `data/site.json` 的 `copyright`，並同步改 perio-classroom 的 `brand/brand.js` 與各集上架素材。
