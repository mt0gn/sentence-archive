import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [component, styles] = await Promise.all([
  readFile(new URL("../app/quote-studio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

test("keeps the July 26 typography decisions", () => {
  assert.doesNotMatch(component, /나눔고딕|MaruBuri|마루부리/);
  assert.match(component, /id: "pretendard"/);
  assert.match(component, /id: "nanum-myeongjo"/);
  assert.match(component, /id: "gmarket-sans"/);
  assert.match(component, /fontId: rule\.fontId/);
  assert.match(component, /fontFamily: getFontFamily\(rule\.fontId\)/);
});

test("keeps the existing multi-speaker messenger and fixed phone chrome", () => {
  assert.match(component, /layout\.speakers\.map/);
  assert.match(component, /문단 \$\{index \+ 1\} 화자/);
  assert.match(component, /type="time"/);
  assert.match(component, /showReadStatus/);
  assert.match(styles, /\.layout-kakao \.preview-overlay, \.layout-dm \.preview-overlay \{ position: absolute; inset: 0; height: 100%/);
  assert.match(styles, /\.messenger-chat-area \{[^}]*overflow-y: auto/);
});

test("keeps the supplementary privacy, canvas, and export decisions", () => {
  assert.match(component, /type ExportScale = 2 \| 3/);
  assert.match(component, /pixelRatio: design\.exportScale/);
  assert.match(component, /const fixedMessenger = layout\.mode === "messenger"/);
  assert.match(component, /layout\.mode === "microfilm"[\s\S]*design\.canvasWidth/);
  assert.match(styles, /\.mosaic-black \.mosaic-text \{[^}]*background: #202124/);
  assert.match(styles, /\.mosaic-blank \.mosaic-text \{ visibility: hidden/);
  assert.match(styles, /\.canvas-panel \{[^}]*grid-template-rows: 48px minmax\(0, 1fr\) 38px/);
});

test("keeps manuscript to the agreed live horizontal and vertical grids", () => {
  assert.match(component, /type ManuscriptTemplate = "horizontal" \| "vertical"/);
  assert.match(component, /가로쓰기[\s\S]*세로쓰기/);
  assert.match(component, /한 줄 칸 수[\s\S]*줄 수/);
  assert.match(component, /manuscriptGridColor/);
  assert.doesNotMatch(component, /manuscript-free-canvas template-\$\{layout\.manuscriptTemplate\}/);
  assert.doesNotMatch(component, /원고지 사진 추가/);
  assert.match(styles, /\.layout-manuscript \.preview-overlay \{ position: absolute; inset: 0; height: 100%; min-height: 0/);
  assert.match(styles, /\.manuscript-sheet\.template-vertical \.manuscript-grid \{[^}]*grid-auto-flow: column/);
});

test("includes the July 28 document, diary, and webcore overhaul", () => {
  assert.match(component, /type DocumentSize = "a4" \| "b5" \| "letter"/);
  assert.match(component, /type WebcoreVariant = "notepad" \| "paint" \| "dialog" \| "minimal"/);
  assert.match(component, /scrapbookSnap/);
  assert.match(component, /scrapbookShowGuides/);
  assert.match(component, /describeTextPosition/);
  assert.match(component, /위치 보기/);
  assert.match(component, /웹코어[\s\S]*90년대 창 UI/);
  assert.match(styles, /\.document-app-chrome/);
  assert.match(styles, /\.webcore-shell/);
  assert.match(styles, /\.scrapbook-guide\.is-horizontal/);
});
