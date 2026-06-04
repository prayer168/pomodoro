# 橡實鐘建置工具與流程

這份文件記錄「橡實鐘」目前版本的建置方法，作為日後整理成完整技術文件的草稿。重點是留下可重複的流程、工具分工與驗證方式。

## 專案目標

橡實鐘是一個工作用番茄鐘。視覺概念從 Forest 類型的「專注時種樹」延伸，改成橡樹生命週期：

1. 小苗從橡實旁萌發
2. 長出子葉與橡樹真葉
3. 樹幹、枝條與裂片狀橡樹葉逐步成形
4. 出現橡樹花序
5. 最後結成帶杯狀帽的橡實

目前版本是原創 SVG 視覺，不複製 Forest 的商標、圖像或 App 畫面。

## 主要檔案

- `index.html`：番茄鐘頁面結構與 SVG 掛載點。
- `styles.css`：版面、色彩、RWD、SVG 階段動畫樣式。
- `script.js`：番茄鐘狀態、localStorage、提醒、SVG DOM 生成與動畫進度控制。
- `tools/generate_oak_acorn_svg.py`：用 Python 產生獨立 SVG 資產。
- `assets/oak-acorn.svg`：由 Python 生成的橡樹生命週期 SVG。
- `README.md`：使用者導向的專案說明。

## 工具鏈

- Git / GitHub：版本管理與發布。
- GitHub CLI `gh`：建立 repo、檢查 Pages build。
- GitHub Pages：靜態網站發布。
- Python：產生可獨立檢視的 SVG 資產。
- JavaScript：在頁面中動態建立 SVG DOM，並依番茄鐘進度控制動畫。
- Browser / 本機 HTTP server：驗證本機頁面與互動。
- PowerShell：執行檢查、建立資料夾、啟動本機伺服器。

## RAG 參考流程

在繪製橡樹與橡實前，先搜尋公開資料與圖片，萃取形狀特徵，再轉成原創 SVG 元件。

參考方向：

- 橡實：橢圓堅果、杯狀 cupule、短柄。
- 小苗：從橡實或根部附近萌發，早期有子葉，之後長出真葉。
- 橡樹葉：真葉具有裂片狀輪廓，不使用單純橢圓葉。
- 橡樹花：雄花序常呈下垂 catkins；雌花較小，之後發育成橡實。

已使用的公開參考來源：

- Pixabay 橡實照片：https://pixabay.com/photos/acorn-oak-tree-branch-fruit-nut-5571048/
- Pexels 橡實照片：https://www.pexels.com/photo/close-up-of-green-acorn-on-oak-tree-34105975/
- Wikipedia Acorn：https://en.wikipedia.org/wiki/Acorn
- International Oak Society 橡實形狀說明：https://www.internationaloaksociety.org/content/acorns-size-matters-and-so-does-shape

後續若要提高真實度，建議補充橡樹小苗、橡樹花序與橡實發育期的更多照片來源，並在技術文件中加入對照表。

## SVG 生成策略

目前採用雙軌策略：

1. Python 產生獨立 SVG 檔案：`assets/oak-acorn.svg`
2. JavaScript 在頁面中動態建立 SVG DOM

這樣做的好處：

- Python SVG 可獨立檢視、版本化與後續做教材截圖。
- JavaScript SVG 可直接跟番茄鐘時間進度綁定。
- 兩邊使用相近的幾何資料，方便維護同一套視覺語言。

## Python 生成流程

執行：

```powershell
python .\tools\generate_oak_acorn_svg.py
```

輸出：

```text
assets/oak-acorn.svg
```

Python 腳本內的重點函式：

- `tag()`：簡單產生 XML / SVG tag。
- `oak_leaf()`：產生裂片狀橡樹葉。
- `catkin()`：產生下垂雄花序。
- `acorn()`：產生橡實本體、杯狀帽與短柄。

## JavaScript 動畫流程

頁面載入後，`script.js` 執行：

```javascript
buildOakSvg();
hydrate();
render();
```

`buildOakSvg()` 使用 `document.createElementNS()` 建立 SVG：

- 小苗：`.svg-seedling`
- 年輕真葉：`.svg-young-leaf`
- 樹體：`.svg-oak`
- 雄花序：`.svg-catkin`
- 雌花：`.svg-female-flower`
- 橡實：`.svg-acorn`

`render()` 依番茄鐘進度計算生命週期變數：

```javascript
--seedling
--leafing
--growth
--flower
--fruit
```

目前階段切分：

- `0% - 28%`：小苗萌發
- `16% - 40%`：長出真葉
- `34% - 66%`：橡樹成形
- `62% - 80%`：開花
- `84% - 100%`：結成橡實

這些變數透過 CSS 控制透明度、縮放與線條顯示。

## 驗證流程

每次修改後至少執行：

```powershell
python .\tools\generate_oak_acorn_svg.py
python -m py_compile .\tools\generate_oak_acorn_svg.py
node --check .\script.js
```

本機頁面驗證：

```powershell
python -m http.server 8020 --bind 127.0.0.1
```

瀏覽器檢查項目：

- `svg.oak-svg` 是否存在。
- `.svg-seedling` 是否存在。
- `.svg-young-leaf` 是否有 2 個。
- `.svg-catkin` 是否有 3 組。
- `.svg-female-flower` 是否存在。
- `.svg-acorn` 是否有 3 顆。
- 按下「種下專注橡樹」後，倒數是否前進。

## GitHub Pages 發布流程

提交：

```powershell
git add README.md index.html script.js styles.css assets/oak-acorn.svg tools/generate_oak_acorn_svg.py
git commit -m "Animate oak lifecycle stages"
git push
```

檢查 Pages build：

```powershell
gh api repos/prayer168/pomodoro/pages/builds/latest --jq '{status,error,created_at,updated_at}'
```

檢查公開頁面：

```powershell
(Invoke-WebRequest -Uri 'https://prayer168.github.io/pomodoro/' -UseBasicParsing).StatusCode
```

期望結果：

- Pages build status：`built`
- HTTP status：`200`

## 後續可調整方向

- 增加更多橡樹小苗照片作為參考，讓早期葉片更接近真實。
- 區分「雄花序」與「雌花」的位置與比例。
- 讓橡實從小型 cupule 逐步長成完整橡實，而不是只做淡入。
- 增加完成後的收成效果，例如橡實落下或今日森林新增橡實標記。
- 補上手機尺寸截圖與視覺 QA 記錄。
- 將 RAG 參考來源整理成表格：來源、觀察到的特徵、對應到 SVG 的哪個元件。
