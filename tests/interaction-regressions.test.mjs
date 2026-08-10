import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [component, styles, paragraphBlocks] = await Promise.all([
  readFile(new URL("../app/quote-studio.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../app/paragraph-blocks.ts", import.meta.url), "utf8"),
]);

test("manual page breaks preserve the edited-copy scroll position", () => {
  const insertManualBreak = component.match(
    /function insertManualBreak\(\) \{[\s\S]*?\n  \}\n\n  function addMosaic/,
  )?.[0];

  assert.ok(insertManualBreak, "insertManualBreak implementation was not found");
  assert.match(insertManualBreak, /const scrollTop = editor\.scrollTop;/);
  assert.match(insertManualBreak, /const scrollLeft = editor\.scrollLeft;/);
  assert.match(insertManualBreak, /editor\.scrollTop = scrollTop;/);
  assert.match(insertManualBreak, /editor\.scrollLeft = scrollLeft;/);
});

test("manuscript cells never draw center crosshairs", () => {
  const manuscriptCellRules = Array.from(styles.matchAll(/([^{}]+)\{([^{}]*)\}/g))
    .filter(([, selector]) => selector.includes(".manuscript-cell"));

  assert.ok(manuscriptCellRules.length > 0, "manuscript cell styles were not found");
  for (const [, selector, body] of manuscriptCellRules) {
    const backgroundImages = Array.from(body.matchAll(/background-image:\s*([^;]+)/g));
    for (const [, value] of backgroundImages) {
      assert.equal(
        value.trim(),
        "none",
        `crosshair background remains in ${selector.trim()}`,
      );
    }
  }
});

test("manuscript formatting scales the character inside a fixed-size grid cell", () => {
  const manuscriptPreview = component.match(
    /function ManuscriptPreview\([\s\S]*?\n\}\n\nfunction NotebookPreview/,
  )?.[0];

  assert.ok(manuscriptPreview, "ManuscriptPreview implementation was not found");
  assert.match(manuscriptPreview, /directMarks: DirectTextMark\[\]/);
  assert.match(manuscriptPreview, /const \{ fontSize, \.\.\.cellStyle \} = combinedStyle;/);
  assert.match(manuscriptPreview, /className="manuscript-character" style=\{fontSize \? \{ fontSize \} : undefined\}/);
  assert.match(styles, /\.manuscript-character\s*\{[^}]*display:\s*grid;/s);
});

test("manuscript applies optical vertical correction for asymmetric font metrics", () => {
  assert.match(component, /id: "nanum-myeongjo"[^\n]*manuscriptOffsetEm:\s*0\.1/);
  assert.match(component, /id: "gmarket-sans"[^\n]*manuscriptOffsetEm:\s*0\.14/);
  assert.match(component, /getManuscriptFontOffset\(font\.id\)/);
  assert.match(component, /markedFontId !== "inherit"[^\n]*--manuscript-character-offset/);
  assert.match(styles, /\.manuscript-cell[^}]*font-size:\s*var\(--text-size\)/s);
  assert.doesNotMatch(styles, /\.manuscript-cell[^}]*font-size:[^;}]*0\.8em/s);
  assert.match(styles, /\.manuscript-character[^}]*translateY\(var\(--manuscript-character-offset, 0\)\)/s);
});

test("manuscript line breaks do not skip a row after an exactly filled line", () => {
  const manuscriptPreview = component.match(
    /function ManuscriptPreview\([\s\S]*?\n\}\n\nfunction NotebookPreview/,
  )?.[0];

  assert.ok(manuscriptPreview, "ManuscriptPreview implementation was not found");
  assert.match(manuscriptPreview, /if \(linePosition > 0\) blanks\(lineLength - linePosition\)/);
  assert.match(manuscriptPreview, /else if \(cells\.length === 0 \|\| previousWasLineBreak\) blanks\(lineLength\)/);
  assert.doesNotMatch(manuscriptPreview, /linePosition === 0 \? lineLength : lineLength - linePosition/);
  assert.match(component, /글자 크기는 그대로 유지하고 원고지 칸 영역을 확대·축소합니다/);
});

test("excerpt attribution uses neutral creator terminology and examples", () => {
  assert.match(component, /attributionVisible:\s*false/);
  assert.match(component, /attributionX:\s*50/);
  assert.match(component, /attributionY:\s*84/);
  assert.match(component, /캐릭터명/);
  assert.match(component, /제작자/);
  assert.match(component, /플랫폼명/);
  assert.match(component, /placeholder="예: 위해"/);
  assert.match(component, /placeholder="예: wesea"/);
  assert.match(component, /placeholder="예: site name"/);
});

test("excerpt attribution platform can move left of the byline endpoint", () => {
  assert.match(component, /attributionOffsetVersion:\s*2/);
  assert.match(component, /attributionGap:\s*value\?\.attributionOffsetVersion === 2 \? clamp\([^\n]*, -400, 400\) : 0/);
  assert.match(component, /플랫폼 가로 위치[^\n]*type="range" min="-400" max="400" step="1"[^\n]*attributionGap/);
  assert.match(styles, /\.excerpt-attribution[^}]*display:\s*inline-flex[^}]*flex-direction:\s*column[^}]*align-items:\s*flex-start/s);
  assert.match(styles, /\.excerpt-attribution strong[^}]*translateX\(var\(--attribution-gap\)\)/s);
});

test("starter copy demonstrates every supported syntax candidate", () => {
  assert.match(component, /\*기울임 구문은 장면과 서술을 표시합니다\.\*/);
  assert.match(component, /\*\*굵은 구문은 강조하고 싶은 문장을 표시합니다\.\*\*/);
  assert.match(component, /'작은따옴표 대사를 확인합니다\.'/);
  assert.match(component, /"큰따옴표 대사를 확인합니다\."/);
  assert.match(component, /\[08월 10일 \| 21:30 \| 기록실\]/);
  assert.match(component, /id: "single-quotes"[\s\S]*name: "작은따옴표"/);
});

test("attribution is rendered above every layout rather than limited by layout mode", () => {
  assert.match(component, /const showAttribution = layout\.attributionVisible && Boolean\(layout\.attributionCharacter \|\| layout\.attributionCreator \|\| layout\.attributionPlatform\)/);
  assert.doesNotMatch(component, /showAttribution =[^\n]*\["classic", "bubble"\]\.includes\(layout\.mode\)/);
  assert.match(component, /<\/>}\s*\{showAttribution && <div className="excerpt-attribution">/);
  assert.match(component, /<small>모든 레이아웃<\/small>/);
});

test("messenger chrome is vertically balanced and uses a send icon", () => {
  assert.match(component, /className="messenger-send"><svg viewBox="0 0 24 24">/);
  assert.doesNotMatch(component, /isDm \? "♡" : "#"/);
  assert.match(styles, /\.messenger-shell[^}]*grid-template-rows:\s*2\.05em 3\.8em minmax\(0, 1fr\) 5\.85em/);
  assert.match(styles, /\.messenger-composer b svg[^}]*fill:\s*currentColor/);
});

test("dialogue rules support directional line styles and per-character assignment", () => {
  assert.match(component, /대사강조선/);
  assert.doesNotMatch(component, /대사 강조선/);
  assert.match(component, /세로 실선[\s\S]*세로 이중선[\s\S]*세로 점선[\s\S]*세로 파선[\s\S]*가로 실선[\s\S]*가로 이중선[\s\S]*가로 점선[\s\S]*가로 파선/);
  assert.doesNotMatch(component, /이중 세로선|짧은 가로선|이중 가로선/);
  assert.match(component, /vertical-dotted/);
  assert.match(component, /vertical-dashed/);
  assert.doesNotMatch(component, /<option value="horizontal-long">/);
  assert.match(component, /메신저 화자 구분/);
  assert.match(component, /const globalParagraphStart = baseOffset \+ paragraph\.start/);
  assert.match(component, /const assignmentKey = `text:\$\{globalParagraphStart\}`/);
  assert.match(component, /dialogueSpeaker\?\.accentColor/);
  assert.match(styles, /\.preview-copy p\.dialogue-line-vertical-dotted::before/);
  assert.match(styles, /\.dialogue-character-editor/);
});

test("the left workflow follows the extraction process", () => {
  const steps = ["원문", "템플릿", "내용 정리", "디자인", "페이지·저장"];
  let previous = -1;
  for (const step of steps) {
    const position = component.indexOf(`label: "${step}"`);
    assert.ok(position > previous, `${step} should follow the previous workflow step`);
    previous = position;
  }
  assert.match(component, /aria-label="발췌 작업 순서"/);
  assert.match(component, /STEP 1–5/);
  assert.match(component, /내용 정리 도구/);
  assert.match(component, /빈 줄을 기준으로 문단을 나눕니다/);
  assert.match(styles, /\.workflow-step-button/);
  assert.match(styles, /\.workflow-panel-bar/);
});

test("the settings panel is resizable and remembers its width", () => {
  assert.match(component, /LEFT_PANEL_WIDTH_KEY/);
  assert.match(component, /aria-label="설정 패널 폭 조절"/);
  assert.match(component, /onPointerDown=\{startLeftPanelResize\}/);
  assert.match(component, /--left-panel-width/);
  assert.match(styles, /\.left-panel-resizer/);
  assert.match(styles, /grid-template-columns:\s*var\(--left-panel-width, 410px\)/);
});

test("template selection includes visual thumbnails and owns output sizing", () => {
  const templatePosition = component.indexOf('className="template-gallery"');
  const outputPosition = component.indexOf('{renderOutputSizeControl()}');
  assert.ok(templatePosition >= 0 && outputPosition > templatePosition, "output sizing should follow the template gallery");
  assert.match(component, /`template-thumbnail thumbnail-\$\{template\.id\}`/);
  assert.match(component, /결과물 규격/);
  assert.match(styles, /\.template-thumbnail/);
  assert.match(styles, /\.thumbnail-manuscript::before[^}]*inset:\s*12% 9%[^}]*background-image:/s);
  assert.match(styles, /\.thumbnail-messenger[^}]*#b7c8d7/);
  assert.match(styles, /\.thumbnail-messenger i:nth-child\(2\)[^}]*#fee500/);
  assert.match(component, /color: "#8caae9"/);
  assert.match(styles, /\.thumbnail-microfilm/);
});

test("microfilm uses freely editable canvas dimensions", () => {
  const getOutputSize = component.match(/function getOutputSize\([\s\S]*?\n\}/)?.[0];
  assert.ok(getOutputSize, "getOutputSize implementation was not found");
  assert.match(getOutputSize, /layout\.mode === "microfilm"[\s\S]*design\.canvasWidth[\s\S]*design\.canvasHeight/);
  assert.doesNotMatch(getOutputSize, /layout\.mode === "microfilm"[\s\S]*fixed:\s*true/);
  assert.match(component, /프레임과 스트립은 시작 규격만 적용합니다/);
  assert.match(styles, /\.microfilm-sheet[^}]*grid-template-rows:\s*32px 24px minmax\(0, 1fr\) 24px 32px/);
  assert.match(styles, /\.microfilm-perforation[^}]*height:\s*13px/);
  assert.match(styles, /\.microfilm-perforation[^}]*transparent 4\.9% 7\.2%/);
  assert.doesNotMatch(styles, /\.microfilm-sheet[^}]*--microfilm-top/);
});

test("paragraph ornaments render fixed SVG assets without modifying source text", () => {
  assert.match(component, /function DividerOrnamentSvg/);
  assert.match(component, /<svg viewBox="0 0 24 24"/);
  assert.match(component, /dividerKind === "ornament"/);
  assert.match(component, /"line", "ornament", "mixed"/);
  assert.match(component, /"선 \+ SVG"/);
  assert.match(component, /dividerThickness/);
  assert.match(component, /원문 문자와 페이지 경계 기능은 이곳에서 다루지 않습니다/);
  assert.match(component, /normalizeFlowBlocks/);
  assert.match(styles, /\.flow-divider-ornament svg/);
  assert.match(styles, /\.flow-divider-mixed/);
  assert.match(styles, /\.ornament-visual-picker/);
  assert.match(component, /<circle cx="8\.4" cy="8\.4" r="4\.6"/);
  assert.doesNotMatch(component, /M13\.4 13\.6c1\.7 2\.2/);
  assert.match(styles, /\.flow-block-card \.flow-block-list > div[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
});

test("DM outgoing bubbles keep readable white text", () => {
  assert.match(styles, /\.layout-dm \.side-right \.message-bubble \.styled-segment/);
  assert.match(styles, /\.layout-dm \.side-right \.message-bubble \.direct-segment[^}]*color:\s*#fff !important/s);
});

test("page headings stay restrained and page numbers respect the canvas padding", () => {
  assert.match(styles, /\.preview-heading b[^}]*font-size:\s*max\(14px, calc\(var\(--text-size\) \* \.98\)\)/);
  assert.match(styles, /\.preview-page-number[^}]*font-size:\s*max\(12px, calc\(var\(--text-size\) \* \.82\)\)/);
  assert.match(component, /hasFooterPageNumber/);
  assert.match(component, /showAttribution && hasFooterPageNumber \? "has-page-number"/);
  assert.match(styles, /\.layout-classic\.has-attribution \.preview-page-number[^}]*right:\s*var\(--padding-right\)[^}]*bottom:\s*var\(--padding-bottom\)/s);
});

test("the header kicker and movable attribution box are user controlled", () => {
  assert.match(component, /headerKicker: string/);
  assert.match(component, /제목 위 작은 문구/);
  assert.match(component, /layout\.headerKicker && <span>\{layout\.headerKicker\}<\/span>/);
  assert.match(component, /attributionX: number/);
  assert.match(component, /attributionY: number/);
  assert.match(component, /attributionGap: number/);
  assert.match(component, /attributionPlatformOffsetY: number/);
  assert.match(component, /발췌 정보 박스 위치/);
  assert.match(component, /플랫폼 가로 위치/);
  assert.match(component, /플랫폼 세로 단차/);
  assert.match(component, /가로 위치[^\n]*type="range" min="0" max="100"[^\n]*attributionX/);
  assert.match(component, /세로 위치[^\n]*type="range" min="0" max="100"[^\n]*attributionY/);
  assert.match(styles, /\.excerpt-attribution[^}]*top:\s*var\(--attribution-y\)[^}]*left:\s*var\(--attribution-x\)[^}]*display:\s*inline-flex[^}]*flex-direction:\s*column/s);
  assert.match(styles, /\.excerpt-attribution strong[^}]*margin-top:\s*var\(--attribution-platform-offset-y\)/s);
  assert.match(styles, /\.excerpt-attribution strong[^}]*transform:\s*translateX\(var\(--attribution-gap\)\)/s);
  assert.match(styles, /transform:\s*translate\(var\(--attribution-shift-x\), var\(--attribution-shift-y\)\)/);
});

test("position sliders use the full zero-to-one-hundred range", () => {
  assert.match(component, /manuscriptGridX[^\n]*, 0, 100\)/);
  assert.match(component, /manuscriptGridY[^\n]*, 0, 100\)/);
  assert.match(component, /가로 위치[^\n]*type="range" min="0" max="100"[^\n]*manuscriptGridX/);
  assert.match(component, /세로 위치[^\n]*type="range" min="0" max="100"[^\n]*manuscriptGridY/);
  assert.match(styles, /transform:\s*translate\(var\(--manuscript-grid-shift-x\), var\(--manuscript-grid-shift-y\)\)/);
});

test("control-card descriptions keep a consistent gap before the next control", () => {
  assert.match(styles, /\.helper-note\s*\{[^}]*margin:\s*4px 0 10px !important/s);
  assert.match(styles, /\.control-card > \.helper-note:last-child[^}]*margin-bottom:\s*0 !important/s);
  assert.match(styles, /\.control-card > \.helper-note \+ \.wide-check[^}]*margin-top:\s*0 !important/s);
});

test("one word search supports accessible per-occurrence selection for anonymizing and replacing", () => {
  assert.match(component, /type MosaicExclusion = \{/);
  assert.match(component, /mosaicExclusions: MosaicExclusion\[\]/);
  assert.match(component, /function isMosaicExcluded/);
  assert.match(component, /hidden && !excluded \? <span className="mosaic-text"/);
  assert.match(component, /current\.mosaicExclusions\.flatMap/);
  assert.match(component, /단어 위치 검색/);
  assert.match(component, /현재 위치 선택 해제/);
  assert.match(component, /현재 위치 다시 선택/);
  assert.match(component, /function showWordMatch/);
  assert.match(component, /function toggleCurrentSearchExclusion/);
  assert.match(component, /searchExcludedStarts/);
  assert.match(component, /function replaceSelectedOccurrences/);
  assert.match(component, /excludedStarts=\{searchExcludedStarts\}/);
  assert.doesNotMatch(component, /익명화 위치 검색/);
  assert.doesNotMatch(component, /확인 작업/);
  assert.doesNotMatch(component, /익명화 확인/);
  assert.doesNotMatch(component, /단어 교체 확인/);
  assert.doesNotMatch(styles, /mosaic-search-match/);
  assert.match(styles, /\.main-editor-highlight mark\s*\{[^}]*background:\s*rgba\(102, 148, 234, \.3\);[^}]*box-shadow:\s*none/s);
});

test("page titles and number labels can be customized globally and per page", () => {
  assert.match(component, /pageTitleOverrides: Record<string, string>/);
  assert.match(component, /pageNumberOverrides: Record<string, string>/);
  assert.match(component, /function formatPageNumberPattern/);
  assert.match(component, /전체 페이지 기본 제목/);
  assert.match(component, /현재 페이지 개별 설정/);
  assert.match(component, /\{'\{current\}'\}/);
  assert.match(component, /pageNumberLabel/);
});

test("two-column form controls share one vertical and sizing contract", () => {
  assert.match(styles, /\.control-card \.split-fields > label, \.control-card \.split-fields > label:first-child[^}]*margin-top:\s*10px/s);
  assert.match(styles, /\.split-fields[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
  assert.match(styles, /\.line-color-field input\[type="color"\][^}]*height:\s*35px/s);
  assert.match(styles, /\.padding-grid label, \.canvas-size-grid label[^}]*margin:\s*0 !important/s);
});

test("notebook leaves its first rule free and keeps emphasis on fixed rows", () => {
  assert.doesNotMatch(component, /notebookTitle/);
  assert.doesNotMatch(component, /노트 제목/);
  assert.match(component, /가장 위의 좁은 줄은 비워 두고, 본문은 두 번째 줄부터 시작합니다/);
  assert.match(styles, /\.notebook-copy\s*\{[^}]*top:\s*var\(--notebook-rule\)/s);
  assert.match(styles, /\.layout-notebook \.preview-copy \.line-vertical-solid,[\s\S]*?display:\s*inline;[\s\S]*?margin:\s*0;/);
  assert.match(styles, /\.layout-notebook \.preview-copy \.line-horizontal-short,[\s\S]*?min-height:\s*var\(--notebook-rule\);[\s\S]*?padding-block:\s*0;/);
  assert.match(styles, /p\.has-dialogue-line\[class\*="dialogue-line-horizontal"\][\s\S]*?height:\s*var\(--notebook-rule\);[\s\S]*?margin:\s*0;/);
});

test("basic backgrounds provide dot radial and check modes without paper texture", () => {
  assert.match(component, /type BackgroundMode = "solid" \| "gradient" \| "image" \| "dot" \| "radial" \| "check"/);
  assert.match(component, /id: "dot", label: "도트"/);
  assert.match(component, /id: "gradient", label: "그라데이션"/);
  assert.match(component, /id: "radial", label: "빛번짐"/);
  assert.match(component, /id: "check", label: "체크"/);
  assert.match(component, /type GlowShape = "circle" \| "star" \| "clover" \| "heart" \| "flower" \| "sparkle"/);
  assert.match(component, /radialGlows: RadialGlow\[\]/);
  assert.match(component, /shape: "circle", color: "#6694ea"/);
  assert.match(component, /className={`preview-glow-item glow-\$\{glow\.shape\}`}/);
  assert.match(component, /＋ 빛번짐 추가/);
  assert.match(component, /네잎클로버/);
  assert.match(component, /하트/);
  assert.match(component, /반짝임/);
  assert.match(component, /min="1" max="80" value=\{design\.patternStrength\}/);
  assert.match(component, /dotSize: number/);
  assert.match(component, /도트 크기/);
  assert.match(component, /min="0\.5" max="160" step="0\.5" value=\{design\.dotSize\}/);
  assert.match(component, /design\.backgroundMode === "check" \? "200" : "400"/);
  assert.match(component, /backgroundPosition: "center center"/);
  assert.equal((component.match(/backgroundPosition: "center center"/g) || []).length, 2);
  assert.match(styles, /\.preview-glow-item\s*\{/);
  assert.doesNotMatch(styles, /\.preview-glow-item[^}]*overflow:\s*hidden/);
  assert.match(styles, /filter:\s*blur\(var\(--glow-blur, 0\)\)/);
  assert.match(component, /"--glow-color-0": colorWithOpacity\(glow\.color, 0\)/);
  assert.match(styles, /var\(--glow-color-0\) 70%/);
  assert.match(component, /본문 세로 위치/);
  assert.match(component, /\["top", "center", "bottom"\] as VerticalAlign\[\]/);
  assert.doesNotMatch(component, /paperTexture|paperStrength|backgroundMode === "paper"/);
  assert.doesNotMatch(styles, /background-paper|paper-fiber|paper-rough|paper-recycled/);
});

test("blank-line paragraphs can be manually classified and rendered without speakers", () => {
  assert.match(paragraphBlocks, /export type ParagraphRole = "dialogue" \| "narration" \| "thought" \| "other"/);
  assert.match(paragraphBlocks, /export type ParagraphPresentation = "line" \| "bubble" \| "quote"/);
  assert.match(paragraphBlocks, /const matcher = \/\[\^\\n\]\(\?:\[\\s\\S\]\*\?\)\(\?=\\n\{2,\}\|\$\)\/g/);
  assert.match(component, /공백 기준 문단 확인/);
  assert.match(component, /미지정 선택/);
  assert.match(component, /서술 사이 선택/);
  assert.match(component, /applyParagraphMarkPatch\(\{ presentation: "bubble" \}, true\)/);
  assert.match(component, /paragraphMarks=\{paragraphMarks\}/);
  assert.match(styles, /\.preview-copy p\.paragraph-presentation-bubble/);
  assert.match(styles, /\.preview-copy p\.paragraph-presentation-quote/);
  assert.match(component, /\["bubble", "messenger"\]\.includes\(layout\.mode\) && <div className="control-card dialogue-character-card"/);
});

test("dialogue syntax rules can request a paragraph presentation", () => {
  assert.match(component, /type RulePresentation = "default" \| ParagraphPresentation/);
  assert.match(component, /presentation: RulePresentation/);
  assert.match(component, /ruleDraft\.presentation === "bubble"/);
  assert.match(component, /ruleDraft\.presentation === "quote"/);
  assert.match(component, /dialogueRule\?\.presentation !== "default"/);
});
