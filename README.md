# 三總牙周小教室網站（雛形）

靜態網站，不需要伺服器，之後放 GitHub Pages。

## 使用方式

```
node build.js        # 讀 data/*.json → 產生 public/
```

直接用瀏覽器打開 `public/index.html` 就能看。

## 檔案

- `data/site.json`：站名、免責聲明、正式網址（`baseUrl`，上線後填，分享預覽圖需要）
- `data/categories.json`：六大主題分類
- `data/journey.json`：「您現在是哪一種情況？」四個入口
- `data/episodes.json`：每集一筆
- `src/style.css`：樣式（色票沿用影片）
- `assets/`：院徽、各集封面縮圖

## 新增一集

在 `data/episodes.json` 加一筆：

| 欄位 | 說明 |
|---|---|
| `id`、`no`、`title` | 編號與標題（`no` 合併回 main、定好集數後再填） |
| `status` | `planned`＝規劃中（只顯示佔位卡、不產生影片頁）；`production`＝製作中或已完成 |
| `draft` | `true` 時影片頁顯示「內容草稿・待醫師確認」 |
| `category` / `alsoIn` | 主分類／同時出現在哪些分類 |
| `journey` | 出現在哪些「情況」入口（依陣列順序就是建議觀看順序） |
| `youtubeId` | 上傳 YouTube 後填入；空白時顯示佔位框 |
| `summary`、`keyPoints` | 一句話摘要、三到五點重點（需醫師確認） |
| `handout` | 可列印單張 PDF 路徑；空白時顯示佔位框 |
| `reviewed` | 最後審閱日期 |
| `related` | 指定「接著看」的影片 id；空白時自動找同分類 |
| `references` | 參考文獻與 PMID（取自該集 01 內容審查報告） |

內容含「（佔位）」的文字會以灰底斜體顯示，方便辨認還沒填的地方。

## 尚待處理

- 正式網址確定後，產生真正的 QR code（`qr.html`）
- 科部介紹、隱私聲明文字
- 每集摘要、重點、單張 PDF、審閱日期
