#!/usr/bin/env node
// 三總牙周小教室網站產生器
// 用法：npm install（第一次）→ node build.js
// 讀 data/*.json，輸出靜態網站到 docs/（GitHub Pages 從 main 分支的 /docs 發布）。
// 新增一集＝在 data/episodes.json 加一筆，再跑一次。QR code 需要 qrcode 套件；沒裝時顯示佔位框。

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'docs');
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

const site = read('site.json');
const cats = read('categories.json');
const journey = read('journey.json');
const eps = read('episodes.json');

const catById = Object.fromEntries(cats.map(c => [c.id, c]));
const epById = Object.fromEntries(eps.map(e => [e.id, e]));
const isPlanned = e => e.status === 'planned';
const made = eps.filter(e => !isPlanned(e));

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isPlaceholder = s => !s || /（佔位）/.test(s);
const CN = '零一二三四五六七八九';
const cnum = n => n < 10 ? CN[n] : (Math.floor(n / 10) === 1 ? '' : CN[Math.floor(n / 10)]) + '十' + (n % 10 ? CN[n % 10] : '');
const epNo = ep => ep.no ? `第${cnum(parseInt(ep.no, 10))}集` : '';
const absUrl = rel => site.baseUrl ? site.baseUrl.replace(/\/$/, '') + '/' + rel : '';
const QR = {};

// ---------- 共用版面 ----------
function layout({ title, desc, image, depth, body, active }) {
  const r = depth ? '../'.repeat(depth) : '';
  const full = title ? `${title}｜${site.name}` : `${site.name}｜${site.org}`;
  const ogImg = image ? (site.baseUrl ? site.baseUrl.replace(/\/$/, '') + '/' + image : r + image) : '';
  const nav = [
    ['index.html', '首頁', 'home'],
    ['start.html', '我該看哪支？', 'start'],
    ['about.html', '關於本站', 'about'],
  ].map(([h, t, k]) => `<a href="${r}${h}"${active === k ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc || site.tagline)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc || site.tagline)}">
${ogImg ? `<meta property="og:image" content="${esc(ogImg)}">` : ''}
<link rel="icon" href="${r}assets/img/tsgh.png">
<link rel="stylesheet" href="${r}assets/style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="${r}index.html">
    <img src="${r}assets/img/tsgh.png" alt="三軍總醫院院徽" width="44" height="44">
    <span><strong>${esc(site.name)}</strong><small>${esc(site.org)}</small></span>
  </a>
  <nav>${nav}</nav>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <p class="note">${esc(site.clinicNote)}</p>
  <p>${esc(site.disclaimer)}</p>
  <p>${esc(site.credit)}</p>
  <p>${esc(site.copyright)}　<a href="${r}about.html#privacy">隱私聲明</a>　<a href="${r}qr.html">診間 QR 卡</a></p>
</footer>
</body>
</html>
`;
}

// ---------- 元件 ----------
const badge = c => `<span class="cat-badge cat-${c.id}" aria-hidden="true">${esc(c.badge || c.name.slice(0, 1))}</span>`;

function card(ep, r) {
  if (isPlanned(ep)) return placeholderCard(ep.title, '規劃中');
  const c = catById[ep.category];
  const thumb = ep.thumb
    ? `<img src="${r}${ep.thumb}" alt="" loading="lazy">`
    : `<div class="ph ph-thumb">封面製作中</div>`;
  return `<a class="card" href="${r}video/${ep.id}.html">
  <div class="thumb">${thumb}${ep.youtubeId ? '' : '<span class="soon">即將上線</span>'}</div>
  <div class="card-body">
    <span class="tag">${esc(c ? c.name : '')}</span>
    <h3>${esc(ep.title)}</h3>
    ${ep.duration ? `<p class="meta">約${esc(ep.duration)}</p>` : ''}
  </div>
</a>`;
}

const placeholderCard = (label = '影片製作中', tag = '佔位') => `<div class="card card-ph">
  <div class="thumb"><div class="ph ph-thumb">${esc(tag)}</div></div>
  <div class="card-body"><span class="tag">${esc(tag)}</span><h3>${esc(label)}</h3></div>
</div>`;

function grid(list, r, minSlots = 0) {
  const items = list.map(e => card(e, r));
  while (items.length < minSlots) items.push(placeholderCard());
  return `<div class="grid">${items.join('\n')}</div>`;
}

// ---------- 頁面 ----------
function pageIndex() {
  const r = '';
  const journeyBtns = journey.map(j =>
    `<a class="journey-btn" href="journey/${j.id}.html"><strong>${esc(j.name)}</strong><span>${esc(j.desc)}</span></a>`).join('\n');
  const catCards = cats.map(c => {
    const inCat = eps.filter(e => e.category === c.id || (e.alsoIn || []).includes(c.id));
    const n = inCat.filter(e => !isPlanned(e)).length, p = inCat.length - n;
    const label = [n ? `${n} 支影片` : '', p ? `${p} 支規劃中` : ''].filter(Boolean).join('・') || '規劃中';
    return `<a class="cat-card" href="category/${c.id}.html">${badge(c)}<div><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><span class="count">${label}</span></div></a>`;
  }).join('\n');
  const latest = made.slice(0, 6);
  const body = `
<section class="hero">
  <h1>${esc(site.tagline)}</h1>
  <p>由三軍總醫院牙周病科醫師製作，每支影片的內容都有醫學文獻依據。</p>
</section>

<section class="block">
  <h2>您現在是哪一種情況？</h2>
  <div class="journey">${journeyBtns}</div>
</section>

<section class="block">
  <h2>依主題找影片</h2>
  <div class="cats">${catCards}</div>
</section>

<section class="block">
  <h2>最新影片</h2>
  ${grid(latest, r, 3)}
</section>`;
  return layout({ depth: 0, body, active: 'home', image: made[0]?.thumb });
}

function pageStart() {
  const body = `
<section class="block">
  <h1>我該看哪支影片？</h1>
  <p class="lead">請選擇最符合您目前狀況的選項，我們會列出建議觀看的影片與順序。</p>
  <div class="journey journey-lg">${journey.map(j =>
    `<a class="journey-btn" href="journey/${j.id}.html"><strong>${esc(j.name)}</strong><span>${esc(j.desc)}</span></a>`).join('\n')}</div>
</section>`;
  return layout({ title: '我該看哪支影片？', depth: 0, body, active: 'start' });
}

function pageJourney(j) {
  const r = '../';
  const list = eps.filter(e => (e.journey || []).includes(j.id));
  const steps = list.length
    ? `<ol class="steps">${list.map(e => `<li>${card(e, r)}</li>`).join('\n')}</ol>`
    : `<div class="ph ph-block">這個情況的建議影片製作中</div>`;
  const more = j.categories.map(id => catById[id]).filter(Boolean)
    .map(c => `<a class="chip" href="${r}category/${c.id}.html">${esc(c.name)}</a>`).join('');
  const body = `
<p class="crumb"><a href="${r}index.html">首頁</a> › <a href="${r}start.html">我該看哪支？</a></p>
<section class="block">
  <h1>${esc(j.name)}</h1>
  <p class="lead">${esc(j.desc)}。建議依下列順序觀看：</p>
  ${steps}
</section>
<section class="block">
  <h2>想看更多</h2>
  <div class="chips">${more}</div>
</section>`;
  return layout({ title: j.name, desc: j.desc, depth: 1, body });
}

function pageCategory(c) {
  const r = '../';
  const list = eps.filter(e => e.category === c.id || (e.alsoIn || []).includes(c.id));
  const body = `
<p class="crumb"><a href="${r}index.html">首頁</a> › ${esc(c.name)}</p>
<section class="block">
  <div class="cat-head">${badge(c)}<div><h1>${esc(c.name)}</h1><p class="lead">${esc(c.desc)}</p></div></div>
  ${grid(list, r, Math.max(2, list.length))}
</section>`;
  return layout({ title: c.name, desc: c.desc, depth: 1, body });
}

function pageVideo(ep) {
  const r = '../';
  const c = catById[ep.category];
  const player = ep.youtubeId
    ? `<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${esc(ep.youtubeId)}?rel=0&modestbranding=1" title="${esc(ep.title)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`
    : `<div class="player player-ph">${ep.thumb ? `<img src="${r}${ep.thumb}" alt="">` : ''}<div class="ph-label">YouTube 影片佔位<br><small>上傳後在 episodes.json 填入 youtubeId</small></div></div>`;

  const points = (ep.keyPoints || []).map(p =>
    `<li${isPlaceholder(p) ? ' class="is-ph"' : ''}>${esc(p)}</li>`).join('');

  const handout = ep.handout
    ? `<section class="panel"><h2>帶回家看</h2><a class="btn" href="${r}${ep.handout}" target="_blank">下載可列印衛教單張</a></section>`
    : '';
  const tip = ep.tip ? `<p class="clinic-note">${esc(ep.tip)}</p>` : '';

  let rel = (ep.related || []).map(id => epById[id]).filter(Boolean);
  if (!rel.length) rel = eps.filter(e => e.id !== ep.id && e.category === ep.category).slice(0, 3);
  rel = rel.filter(e => !isPlanned(e)).concat(rel.filter(isPlanned)).slice(0, 3);
  const relHtml = grid(rel, r, 2);

  const refs = (ep.references || []).map(x => {
    const link = x.pmid
      ? ` <a href="https://pubmed.ncbi.nlm.nih.gov/${esc(x.pmid)}/" target="_blank" rel="noopener">PMID ${esc(x.pmid)}</a>`
      : (x.url ? ` <a href="${esc(x.url)}" target="_blank" rel="noopener">連結</a>` : '');
    return `<li>${esc(x.text)}${link}</li>`;
  }).join('\n');

  const tags = (ep.tags || []).map(t => `<span class="chip chip-static">${esc(t)}</span>`).join('');

  const body = `
<p class="crumb"><a href="${r}index.html">首頁</a> › <a href="${r}category/${c.id}.html">${esc(c.name)}</a></p>
<article class="video">
  ${player}
  <div class="video-head">
    ${ep.draft ? '<p class="draft-flag">內容草稿・待醫師確認</p>' : ''}
    <h1>${esc(ep.title)}</h1>
    <p class="meta">${[epNo(ep), ep.duration ? `約${esc(ep.duration)}` : ''].filter(Boolean).join('　')}</p>
    <p class="summary${isPlaceholder(ep.summary) ? ' is-ph' : ''}">${esc(ep.summary)}</p>
    <div class="chips">${tags}</div>
  </div>

  <div class="actions">
    <button class="btn" type="button" data-share>分享給家人</button>
    <a class="btn btn-line" data-line href="#">用 LINE 傳送</a>
    ${ep.youtubeId ? `<a class="btn" href="https://youtu.be/${esc(ep.youtubeId)}" target="_blank" rel="noopener">在 YouTube 觀看</a>` : ''}
  </div>

  <section class="panel">
    <h2>這支影片的重點</h2>
    <ul class="points">${points}</ul>
  </section>

  ${tip}
  ${handout}

  <section class="block">
    <h2>接著看</h2>
    ${relHtml}
  </section>

  <details class="refs">
    <summary>參考文獻（${(ep.references || []).length ? (ep.references.length + ' 篇') : '佔位'}）</summary>
    <ol>${refs}</ol>
  </details>
  ${ep.reviewed ? `<p class="reviewed">內容最後審閱：${esc(ep.reviewed)}</p>` : ''}
</article>
<script>
(function(){
  var url = location.href, title = document.title;
  var line = document.querySelector('[data-line]');
  if (line) line.href = 'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url);
  var b = document.querySelector('[data-share]');
  if (b) b.addEventListener('click', function(){
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function(){}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function(){ b.textContent = '已複製連結'; }); }
  });
})();
</script>`;
  return layout({ title: ep.title, desc: isPlaceholder(ep.summary) ? '' : ep.summary, image: ep.thumb, depth: 1, body });
}

function pageQR() {
  const items = [
    ...journey.map(j => ({ label: j.name, sub: '依情況推薦', path: `journey/${j.id}.html` })),
    ...cats.map(c => ({ label: c.name, sub: '主題分類', path: `category/${c.id}.html` })),
    ...made.map(e => ({ label: e.title, sub: '單支影片', path: `video/${e.id}.html` })),
  ];
  const body = `
<section class="block no-print">
  <h1>診間 QR 卡</h1>
  <p class="lead">列印後剪下，門診時交給病人掃描，手機相機對準就能直接開啟對應的頁面。</p>
  <button class="btn" type="button" onclick="window.print()">列印這一頁</button>
</section>
<div class="qr-sheet">${items.map(i => `
  <div class="qr-card">
    ${QR[i.path] ? `<div class="qr">${QR[i.path]}</div>` : `<div class="ph ph-qr">QR code<br><small>${esc(i.path)}</small></div>`}
    <div><small>${esc(i.sub)}</small><strong>${esc(i.label)}</strong><span>${esc(site.name)}</span></div>
  </div>`).join('')}
</div>`;
  return layout({ title: '診間 QR 卡', depth: 0, body });
}

function pageAbout() {
  const body = `
<section class="block prose">
  <h1>關於本站</h1>
  <h2>製作單位</h2>
  <p>「三總牙周小教室」是三軍總醫院牙周病科的病人衛教影片系列，由陳穎吾醫師撰寫腳本與製作，幫助病人在門診之外，也能把重要的照顧方法帶回家。</p>
  <h2>內容如何產生</h2>
  <p>每支影片的醫學說法都經牙周病專科醫師審查，並附上參考文獻（PubMed 編號 PMID），您可以在每支影片頁面最下方查看。</p>
  <h2 id="disclaimer">免責聲明</h2>
  <p>${esc(site.disclaimer)}${esc(site.clinicNote)}</p>
  <p>本網站不提供線上諮詢，也不回覆個人病情問題。</p>
  <h2 id="privacy">隱私聲明</h2>
  <p>本站不需要登入，不設表單，也不蒐集您的個人資料。</p>
  <p>影片由 YouTube 提供播放，使用 YouTube 的隱私強化模式；播放影片時，YouTube 的資料處理依其隱私權政策。本站由 GitHub Pages 代管，主機的連線紀錄依 GitHub 的隱私權政策處理。</p>
</section>`;
  return layout({ title: '關於本站', depth: 0, body, active: 'about' });
}

// ---------- 輸出 ----------
function write(rel, html) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
}

async function makeQR(paths) {
  if (!site.baseUrl) return;
  let lib;
  try { lib = require('qrcode'); } catch (e) { console.warn('未安裝 qrcode，QR 卡顯示佔位框（先跑 npm install）'); return; }
  for (const p of paths) QR[p] = await lib.toString(absUrl(p), { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#2B3A55', light: '#FFFFFF' } });
}

(async () => {
await makeQR([...journey.map(j => `journey/${j.id}.html`), ...cats.map(c => `category/${c.id}.html`), ...made.map(e => `video/${e.id}.html`)]);
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src', 'style.css'), path.join(OUT, 'assets', 'style.css'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

write('index.html', pageIndex());
write('start.html', pageStart());
write('about.html', pageAbout());
write('qr.html', pageQR());
journey.forEach(j => write(`journey/${j.id}.html`, pageJourney(j)));
cats.forEach(c => write(`category/${c.id}.html`, pageCategory(c)));
made.forEach(e => write(`video/${e.id}.html`, pageVideo(e)));

console.log(`完成：${made.length} 支影片（另 ${eps.length - made.length} 支規劃中）、${cats.length} 個分類、${journey.length} 個情況、${Object.keys(QR).length} 個 QR code → docs/`);
})();
