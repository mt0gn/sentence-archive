/* eslint-disable react-hooks/set-state-in-effect, @next/next/no-img-element */
"use client";

import {
  ChangeEvent,
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  normalizeParagraphMarks,
  ParagraphLineStyle,
  ParagraphMark,
  ParagraphPresentation,
  ParagraphRole,
  rebaseParagraphMarks,
  splitParagraphsWithOffsets,
} from "./paragraph-blocks";
import { APP_NAME, APP_STAMP, APP_TAGLINE } from "./brand";

type ToolId = "import" | "rules" | "edit" | "privacy" | "design" | "layout" | "export";
type WorkflowStepId = "source" | "template" | "content" | "design" | "finish";
type MobileView = "tools" | "editor" | "reference";
type InspectorTab = "draft" | "source" | "pages";
type BackgroundMode = "solid" | "gradient" | "image" | "dot" | "radial" | "check";
type GlowShape = "circle" | "star" | "clover" | "heart" | "flower" | "sparkle";
type LayoutMode = "classic" | "notebook" | "document" | "manuscript" | "microfilm" | "webcore" | "bubble" | "messenger" | "kakao" | "dm" | "booklet" | "scrapbook";
type FontId =
  | "pretendard"
  | "nanum-myeongjo"
  | "gmarket-sans"
  | "mona12"
  | "noto-sans"
  | "noto-serif"
  | "gowun-batang"
  | "gowun-dodum";
type TextAlign = "left" | "center" | "right" | "justify";
type VerticalAlign = "top" | "center" | "bottom";
type SpeakerSide = "left" | "right";
type ExportFormat = "png" | "jpeg" | "webp";
type SurfaceSize = "standard" | "banner";
type ExportScale = 2 | 3;
type CanvasFitMode = "all" | "width" | "height" | "custom";
type ImageFit = "cover" | "contain" | "stretch";
type TextLineStyle = "none" | "vertical-solid" | "vertical-double" | "vertical-dotted" | "vertical-dashed" | "horizontal-short" | "horizontal-double" | "horizontal-dotted" | "horizontal-dashed";
type RuleLineStyle = TextLineStyle;
type RulePresentation = "default" | ParagraphPresentation;
type LinePurpose = "emphasis" | "quote";
type LineStroke = "solid" | "double" | "dotted" | "dashed";
type ParagraphMarkPatch = {
  role?: ParagraphRole | null;
  presentation?: ParagraphPresentation | null;
  color?: string | null;
  bold?: boolean | null;
  italic?: boolean | null;
  presentationColor?: string | null;
  lineStyle?: ParagraphLineStyle | null;
  linePosition?: "above" | "below" | null;
};
type ManuscriptMode = "horizontal" | "vertical";
type ManuscriptTemplate = "horizontal" | "vertical";
type ManuscriptDirection = "ltr" | "rtl";
type MessengerStyle = "kakao" | "dm";
type NotebookPattern = "line" | "grid" | "dot";
type ScrapbookFrameStyle = "none" | "paper" | "outline" | "note" | "polaroid" | "grid" | "film";
type WrapMode = "normal" | "keep-all" | "break-all";
type PaginationBasis = "canvas" | "characters";
type MosaicMode = "black" | "blank";
type DocumentSize = "a4" | "b5" | "letter";
type DocumentOrientation = "portrait" | "landscape";
type DocumentView = "print" | "editor";
type WebcoreVariant = "notepad" | "paint" | "dialog" | "minimal";
type WebcorePalettePosition = "none" | "bottom" | "left" | "right";
type MicrofilmBodyAlign = "top" | "center" | "bottom";
type FlowPlacement = "flow" | "float-left" | "float-right";
type DividerKind = "line" | "ornament" | "mixed";
type DividerOrnament = "asterisk" | "flower" | "clover" | "star" | "sparkle" | "diamond";

const MIN_CANVAS_SIZE = 32;
const MAX_CANVAS_WIDTH = 4000;
const MAX_CANVAS_HEIGHT = 8000;
const canvasLayoutLabels: Partial<Record<LayoutMode, string>> = {
  classic: "CLASSIC",
  notebook: "NOTEBOOK",
  document: "OFFICE",
  manuscript: "MANUSCRIPT",
  microfilm: "MICROFILM",
  webcore: "WEBCORE",
  bubble: "BUBBLE",
  messenger: "MESSENGER",
};

type SyntaxRule = {
  id: string;
  label: string;
  start: string;
  end: string;
  role: "narration" | "dialogue" | "status" | "emphasis" | "other";
  color: string;
  bold: boolean;
  italic: boolean;
  removeMarkers: boolean;
  fontId: FontId | "inherit";
  fontScale: number;
  highlightColor: string;
  presentation: RulePresentation;
  lineStyle: RuleLineStyle;
  linePosition: "above" | "below";
  lineColor: string;
};

type DirectTextStyle = {
  bold: boolean;
  italic: boolean;
  color: string;
  highlightColor: string;
  fontId: FontId | "inherit";
  fontScale: number;
  lineStyle: TextLineStyle;
  linePosition: "above" | "below";
  lineColor: string;
  bubbleSpeakerId: string;
  time: string;
  readStatus: string;
};

type DirectTextMark = {
  id: string;
  start: number;
  end: number;
  style: DirectTextStyle;
  kind?: "format" | "highlight";
};

type MosaicExclusion = {
  id: string;
  term: string;
  start: number;
  end: number;
};

type FlowBlock = {
  id: string;
  anchor: number;
  type: "title" | "subtitle" | "image" | "divider" | "vertical-divider";
  text?: string;
  src?: string;
  width?: number;
  align?: TextAlign;
  placement?: FlowPlacement;
  dividerStyle?: "solid" | "dotted" | "dashed" | "double";
  dividerLength?: "short" | "long";
  dividerKind?: DividerKind;
  dividerOrnament?: DividerOrnament;
  dividerColor?: string;
  dividerWidth?: number;
  dividerThickness?: number;
  dividerSpacing?: number;
  ornamentCount?: number;
  ornamentSize?: number;
  ornamentGap?: number;
  photoOnly?: boolean;
  messageSpeakerId?: string;
  time?: string;
  readStatus?: string;
};

type Candidate = {
  id: string;
  name: string;
  start: string;
  end: string;
  count: number;
  description: string;
};

type ReplacementRecord = {
  id: string;
  from: string;
  to: string;
  count: number;
  before: string;
  after: string;
  createdAt: string;
  undone: boolean;
};

type ParsedSegment = { text: string; rule: SyntaxRule | null; start: number; end: number };

type RadialGlow = {
  id: string;
  shape: GlowShape;
  color: string;
  x: number;
  y: number;
  size: number;
  blur: number;
};

type DesignSettings = {
  backgroundMode: BackgroundMode;
  solidColor: string;
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  gradientDirection: number;
  imageBackground: string | null;
  imageFit: ImageFit;
  imagePositionX: number;
  imagePositionY: number;
  imageScale: number;
  imageBlur: number;
  overlayColor: string;
  overlayOpacity: number;
  paperColor: string;
  patternBaseColor: string;
  patternColor: string;
  patternSize: number;
  dotSize: number;
  patternStrength: number;
  radialBaseColor: string;
  radialGlows: RadialGlow[];
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphSpacing: number;
  textScaleX: number;
  textShadowEnabled: boolean;
  textShadowColor: string;
  textShadowBlur: number;
  textColumns: number;
  columnGap: number;
  wrapMode: WrapMode;
  fontId: FontId;
  textColor: string;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  contentPadding: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingLinked: boolean;
  showHeader: boolean;
  showPageNumber: boolean;
  manuscriptColumns: number;
  manuscriptRows: number;
  ratio: string;
  canvasWidth: number;
  canvasHeight: number;
  ratioLocked: boolean;
  surfaceSize: SurfaceSize;
  exportScale: ExportScale;
  mosaicMode: MosaicMode;
};

type Speaker = {
  id: string;
  name: string;
  side: SpeakerSide;
  color: string;
  textColor: string;
  accentColor: string;
  avatar: string | null;
};

type MessageMeta = {
  time: string;
  readStatus: string;
};

type LayoutSettings = {
  mode: LayoutMode;
  autoPaginate: boolean;
  paginationBasis: PaginationBasis;
  pageCapacity: number;
  speakers: Speaker[];
  assignments: Record<string, string>;
  messageMeta: Record<string, MessageMeta>;
  showAvatars: boolean;
  compactAvatars: boolean;
  showTails: boolean;
  showSpeakerNames: boolean;
  showTime: boolean;
  showReadStatus: boolean;
  bubbleMaxWidth: number;
  bubbleRadius: number;
  bubblePaddingX: number;
  bubblePaddingY: number;
  messageGap: number;
  messengerStyle: MessengerStyle;
  dmTheme: "light" | "dark";
  chatTitle: string;
  chatSubtitle: string;
  chatDate: string;
  statusBarTime: string;
  chatComposerText: string;
  manuscriptTitle: string;
  manuscriptTitleLabel: string;
  manuscriptSheetLabel: string;
  manuscriptFooterLeft: string;
  manuscriptFooterRight: string;
  manuscriptMode: ManuscriptMode;
  manuscriptTemplate: ManuscriptTemplate;
  manuscriptDirection: ManuscriptDirection;
  manuscriptGridColor: string;
  manuscriptGridX: number;
  manuscriptGridY: number;
  manuscriptGridWidth: number;
  manuscriptLineGap: number;
  manuscriptShowHeader: boolean;
  manuscriptShowPageNumber: boolean;
  manuscriptShowFooter: boolean;
  notebookDate: string;
  notebookMeta: string;
  notebookPattern: NotebookPattern;
  microfilmCollection: string;
  microfilmFrame: string;
  microfilmDate: string;
  microfilmCaption: string;
  microfilmColumns: 1 | 2;
  microfilmTopMargin: number;
  microfilmBodyAlign: MicrofilmBodyAlign;
  documentSize: DocumentSize;
  documentOrientation: DocumentOrientation;
  documentView: DocumentView;
  documentFileName: string;
  documentShowRulers: boolean;
  documentShowHeader: boolean;
  documentHeader: string;
  documentShowFooter: boolean;
  documentFooter: string;
  bookFeaturesEnabled: boolean;
  bookView: "single" | "spread";
  showCover: boolean;
  bookTitle: string;
  bookSubtitle: string;
  bookAuthor: string;
  chapterTitle: string;
  runningHeader: string;
  paragraphIndent: boolean;
  rotateOutput: boolean;
  scrapbookSnap: boolean;
  scrapbookShowGuides: boolean;
  webcoreVariant: WebcoreVariant;
  webcoreTitle: string;
  webcoreFileName: string;
  webcoreMenu: string;
  webcorePalettePosition: WebcorePalettePosition;
  webcoreShowScrollbars: boolean;
  webcoreWindowColor: string;
  webcoreTitleColor: string;
  webcoreBodyColor: string;
  webcoreTextColor: string;
  attributionVisible: boolean;
  attributionCharacter: string;
  attributionCreator: string;
  attributionPlatform: string;
  attributionX: number;
  attributionY: number;
  attributionGap: number;
  attributionOffsetVersion: 2;
  attributionPlatformOffsetY: number;
  mosaicExclusions: MosaicExclusion[];
  dialogueShowNames: boolean;
  headerKicker: string;
  pageTitle: string;
  pageNumberPattern: string;
  pageTitleOverrides: Record<string, string>;
  pageNumberOverrides: Record<string, string>;
  attributionAuthor?: string;
};

type ScrapbookElement = {
  id: string;
  kind: "paragraph" | "image" | "sticker";
  paragraphIndex?: number;
  src?: string;
  sticker?: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  z: number;
  frameStyle?: ScrapbookFrameStyle;
};

type ScrapbookPageState = {
  elements: ScrapbookElement[];
};

type ProjectSnapshot = {
  version: 2;
  id: string;
  title: string;
  source: string;
  draft: string;
  rules: SyntaxRule[];
  mosaicTerms: string[];
  design: DesignSettings;
  layout: LayoutSettings;
  scrapbookPages?: Record<string, ScrapbookPageState>;
  directMarks?: DirectTextMark[];
  flowBlocks?: FlowBlock[];
  paragraphMarks?: ParagraphMark[];
  updatedAt: number;
};

type SavedDesign = {
  id: string;
  name: string;
  design: DesignSettings;
  layoutMode?: LayoutMode;
  updatedAt: number;
};

type ImportItem = { name: string; source: string; draft: string; project?: ProjectSnapshot };
type PendingImport = { items: ImportItem[]; stripHtml: boolean; origin: "files" | "source" };
type PageItem = { id: string; text: string; sourceIndex: number; startOffset: number; cover?: boolean };

const MANUAL_BREAK = "\n\n--- 페이지 나누기 ---\n\n";
const PROJECTS_KEY = "quote-studio-projects-v2";
const ACTIVE_PROJECT_KEY = "quote-studio-active-project-v2";
const DESIGNS_KEY = "quote-studio-designs-v1";
const LEFT_PANEL_WIDTH_KEY = "quote-studio-left-panel-width-v1";
const DEFAULT_LEFT_PANEL_WIDTH = 410;
const MIN_LEFT_PANEL_WIDTH = 350;
const MAX_LEFT_PANEL_WIDTH = 560;

const sampleText = `*기울임 구문은 장면과 서술을 표시합니다.*

**굵은 구문은 강조하고 싶은 문장을 표시합니다.**

'작은따옴표 대사를 확인합니다.'

"큰따옴표 대사를 확인합니다."

\`\`\`
[08월 10일 | 21:30 | 기록실]
관계 | 오래된 친구
상황 | 늦은 밤의 대화를 기록하는 중
\`\`\``;

const toolItems: Array<{ id: WorkflowStepId; label: string; description: string; primaryTool: ToolId; tools: ToolId[] }> = [
  { id: "source", label: "원문", description: "대사와 서술이 포함된 원문을 불러옵니다.", primaryTool: "import", tools: ["import"] },
  { id: "template", label: "템플릿", description: "발췌 형식과 결과물 크기를 먼저 선택합니다.", primaryTool: "layout", tools: ["layout"] },
  { id: "content", label: "내용 정리", description: "대사·서술, 본문, 익명화를 한곳에서 정리합니다.", primaryTool: "rules", tools: ["rules", "edit", "privacy"] },
  { id: "design", label: "디자인", description: "글꼴, 색상, 배경과 여백을 조정합니다.", primaryTool: "design", tools: ["design"] },
  { id: "finish", label: "페이지·저장", description: "페이지를 최종 확인하고 결과물을 저장합니다.", primaryTool: "export", tools: ["export"] },
];

const contentToolItems: Array<{ id: Extract<ToolId, "rules" | "edit" | "privacy">; label: string }> = [
  { id: "rules", label: "대사·서술" },
  { id: "edit", label: "본문·장식" },
  { id: "privacy", label: "익명화·교체" },
];

const layoutTemplates: Array<{ id: LayoutMode; label: string; description: string }> = [
  { id: "classic", label: "기본 발췌", description: "장문과 일반 발췌" },
  { id: "notebook", label: "노트", description: "줄·격자·도트 노트" },
  { id: "document", label: "오피스", description: "문서 편집 화면" },
  { id: "manuscript", label: "원고지", description: "가로·세로 원고지" },
  { id: "microfilm", label: "마이크로필름", description: "필름 프레임과 스트립" },
  { id: "webcore", label: "웹코어", description: "고전 창과 메모장" },
  { id: "bubble", label: "말풍선", description: "캐릭터 대화 카드" },
  { id: "messenger", label: "메신저", description: "카카오톡과 DM" },
];

const textLineStyleOptions: Array<{ value: TextLineStyle; label: string }> = [
  { value: "none", label: "없음" },
  { value: "vertical-solid", label: "세로 실선" },
  { value: "vertical-double", label: "세로 이중선" },
  { value: "vertical-dotted", label: "세로 점선" },
  { value: "vertical-dashed", label: "세로 파선" },
];

function getLineStroke(style: TextLineStyle): LineStroke {
  if (style.endsWith("double")) return "double";
  if (style.endsWith("dotted")) return "dotted";
  if (style.endsWith("dashed")) return "dashed";
  return "solid";
}

function composeVerticalLineStyle(stroke: LineStroke): ParagraphLineStyle {
  return `vertical-${stroke}` as ParagraphLineStyle;
}

function verticalizeLineStyle(style: TextLineStyle): TextLineStyle {
  if (style === "none" || style.startsWith("vertical")) return style;
  return composeVerticalLineStyle(getLineStroke(style));
}

const dividerOrnamentOptions: Array<{ value: DividerOrnament; label: string }> = [
  { value: "flower", label: "꽃" },
  { value: "clover", label: "클로버" },
  { value: "star", label: "별" },
  { value: "sparkle", label: "반짝임" },
  { value: "asterisk", label: "별표" },
  { value: "diamond", label: "마름모" },
];

const UI_ACCENT = "#6694EA";
const publicAsset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
const outputColorPresets = ["#f4f1ea", "#ffffff", "#171719", "#dfe6ee", "#eadfe4", "#dfe9df", "#e9e0cf", "#343841"];
const emptyRuleDraft: Omit<SyntaxRule, "id"> = { label: "새 규칙", start: "", end: "", role: "other", color: "#5e5e66", bold: false, italic: false, removeMarkers: false, fontId: "inherit", fontScale: 100, highlightColor: "transparent", presentation: "default", lineStyle: "none", linePosition: "below", lineColor: "#6694ea" };
const emptyDirectStyle: DirectTextStyle = { bold: false, italic: false, color: "#2d2b2a", highlightColor: "transparent", fontId: "inherit", fontScale: 100, lineStyle: "none", linePosition: "below", lineColor: "#6694ea", bubbleSpeakerId: "", time: "", readStatus: "" };
const fontOptions: Array<{ id: FontId; label: string; family: string; category: "고딕" | "명조" | "기타"; weight: string; manuscriptOffsetEm?: number; cssUrl?: string; fileUrl?: string; format?: string }> = [
  { id: "pretendard", label: "프리텐다드", family: '"Pretendard", sans-serif', category: "고딕", weight: "45 920", fileUrl: publicAsset("/fonts/PretendardVariable.woff2") },
  { id: "nanum-myeongjo", label: "나눔명조", family: '"Nanum Myeongjo", "Noto Serif KR", serif', category: "명조", weight: "400", manuscriptOffsetEm: 0.1, fileUrl: publicAsset("/fonts/NanumMyeongjo-Regular.woff2") },
  { id: "gmarket-sans", label: "G마켓 산스", family: '"Gmarket Sans", "Pretendard", sans-serif', category: "기타", weight: "500", manuscriptOffsetEm: 0.14, fileUrl: publicAsset("/fonts/GmarketSansMedium.woff"), format: "woff" },
  { id: "mona12", label: "Mona12", family: '"Mona12", "Pretendard", sans-serif', category: "기타", weight: "400", fileUrl: publicAsset("/fonts/Mona12.woff2") },
  { id: "noto-sans", label: "노토 고딕", family: '"Noto Sans KR", sans-serif', category: "고딕", weight: "400", fileUrl: publicAsset("/fonts/NotoSansKR-Regular.woff2") },
  { id: "noto-serif", label: "노토 명조", family: '"Noto Serif KR", serif', category: "명조", weight: "400", fileUrl: publicAsset("/fonts/NotoSerifKR-Regular.woff2") },
  { id: "gowun-batang", label: "고운 바탕", family: '"Gowun Batang", serif', category: "명조", weight: "400", fileUrl: publicAsset("/fonts/GowunBatang-Regular.woff2") },
  { id: "gowun-dodum", label: "고운 돋움", family: '"Gowun Dodum", sans-serif', category: "고딕", weight: "400", fileUrl: publicAsset("/fonts/GowunDodum-Regular.woff2") },
];
const orderedFonts = [
  "pretendard",
  "noto-sans",
  "gowun-dodum",
  "noto-serif",
  "gowun-batang",
  "nanum-myeongjo",
  "gmarket-sans",
  "mona12",
].map((id) => fontOptions.find((font) => font.id === id)).filter((font): font is (typeof fontOptions)[number] => Boolean(font));

function normalizeStoredFontId(value: unknown, fallback: FontId | "inherit") {
  const stored = String(value || fallback);
  const requested = stored === "sun-batang" ? "nanum-myeongjo" : stored;
  if (requested === "inherit") return "inherit";
  return fontOptions.some((font) => font.id === requested) ? requested as FontId : fallback;
}

const defaultDesign: DesignSettings = {
  backgroundMode: "solid",
  solidColor: "#f4f1ea",
  gradientStart: "#f7faff",
  gradientMiddle: "#e8f0ff",
  gradientEnd: "#cfddfb",
  gradientDirection: 145,
  imageBackground: null,
  imageFit: "cover",
  imagePositionX: 50,
  imagePositionY: 50,
  imageScale: 100,
  imageBlur: 0,
  overlayColor: "#ffffff",
  overlayOpacity: 82,
  paperColor: "#f4f1ea",
  patternBaseColor: "#ffffff",
  patternColor: "#6694ea",
  patternSize: 24,
  dotSize: 1.15,
  patternStrength: 28,
  radialBaseColor: "#f8faff",
  radialGlows: [{ id: "glow-default", shape: "circle", color: "#6694ea", x: 50, y: 50, size: 72, blur: 12 }],
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.85,
  letterSpacing: 0,
  paragraphSpacing: 1,
  textScaleX: 100,
  textShadowEnabled: false,
  textShadowColor: "#000000",
  textShadowBlur: 0,
  textColumns: 1,
  columnGap: 32,
  wrapMode: "normal",
  fontId: "noto-serif",
  textColor: "#2d2b2a",
  textAlign: "left",
  verticalAlign: "top",
  contentPadding: 11,
  paddingTop: 56,
  paddingRight: 56,
  paddingBottom: 56,
  paddingLeft: 56,
  paddingLinked: true,
  showHeader: false,
  showPageNumber: false,
  manuscriptColumns: 20,
  manuscriptRows: 10,
  ratio: "4 / 5",
  canvasWidth: 540,
  canvasHeight: 675,
  ratioLocked: true,
  surfaceSize: "standard",
  exportScale: 2,
  mosaicMode: "black",
};

const defaultSpeakers: Speaker[] = [
  { id: "speaker-character", name: "위해", side: "left", color: "#ffffff", textColor: "#171719", accentColor: "#788ee0", avatar: null },
  { id: "speaker-user", name: "wesea", side: "right", color: "#8caae9", textColor: "#171719", accentColor: "#6694ea", avatar: null },
];

const defaultLayout: LayoutSettings = {
  mode: "classic",
  autoPaginate: false,
  paginationBasis: "canvas",
  pageCapacity: 1200,
  speakers: defaultSpeakers,
  assignments: {},
  messageMeta: {},
  showAvatars: true,
  compactAvatars: true,
  showTails: true,
  showSpeakerNames: true,
  showTime: false,
  showReadStatus: false,
  bubbleMaxWidth: 72,
  bubbleRadius: 16,
  bubblePaddingX: 12,
  bubblePaddingY: 9,
  messageGap: 10,
  messengerStyle: "kakao",
  dmTheme: "light",
  chatTitle: "대화",
  chatSubtitle: "",
  chatDate: "",
  statusBarTime: "09:41",
  chatComposerText: "메시지 보내기",
  manuscriptTitle: "",
  manuscriptTitleLabel: "제목",
  manuscriptSheetLabel: "매수",
  manuscriptFooterLeft: "원고지 200자",
  manuscriptFooterRight: APP_STAMP,
  manuscriptMode: "horizontal",
  manuscriptTemplate: "horizontal",
  manuscriptDirection: "ltr",
  manuscriptGridColor: "#b35c52",
  manuscriptGridX: 50,
  manuscriptGridY: 50,
  manuscriptGridWidth: 86,
  manuscriptLineGap: 3,
  manuscriptShowHeader: true,
  manuscriptShowPageNumber: true,
  manuscriptShowFooter: true,
  notebookDate: "2026. 07. 22",
  notebookMeta: "NOTE · 01",
  notebookPattern: "line",
  microfilmCollection: `ARCHIVE / ${APP_STAMP}`,
  microfilmFrame: "FRAME 001",
  microfilmDate: "2026 · 07 · 22",
  microfilmCaption: "SELECTED CONVERSATION",
  microfilmColumns: 1,
  microfilmTopMargin: 0,
  microfilmBodyAlign: "center",
  documentSize: "a4",
  documentOrientation: "portrait",
  documentView: "print",
  documentFileName: "새 문서 1",
  documentShowRulers: true,
  documentShowHeader: true,
  documentHeader: APP_STAMP,
  documentShowFooter: true,
  documentFooter: "",
  bookFeaturesEnabled: false,
  bookView: "single",
  showCover: false,
  bookTitle: "",
  bookSubtitle: "",
  bookAuthor: "",
  chapterTitle: "",
  runningHeader: "",
  paragraphIndent: true,
  rotateOutput: false,
  scrapbookSnap: true,
  scrapbookShowGuides: true,
  webcoreVariant: "notepad",
  webcoreTitle: "Untitled - Notepad",
  webcoreFileName: "untitled.txt",
  webcoreMenu: "File   Edit   Search   Help",
  webcorePalettePosition: "none",
  webcoreShowScrollbars: true,
  webcoreWindowColor: "#c0c0c0",
  webcoreTitleColor: "#000080",
  webcoreBodyColor: "#ffffff",
  webcoreTextColor: "#111111",
  attributionVisible: false,
  attributionCharacter: "",
  attributionCreator: "",
  attributionPlatform: "",
  attributionX: 50,
  attributionY: 84,
  attributionGap: 0,
  attributionOffsetVersion: 2,
  attributionPlatformOffsetY: 12,
  mosaicExclusions: [],
  dialogueShowNames: false,
  headerKicker: "QUOTE",
  pageTitle: "",
  pageNumberPattern: "{current:02} / {total:02}",
  pageTitleOverrides: {},
  pageNumberOverrides: {},
};

function normalizeLayout(value?: Partial<LayoutSettings>, legacyDesign?: Partial<DesignSettings> | Record<string, unknown>): LayoutSettings {
  const legacyBackground = String(legacyDesign?.backgroundMode || "");
  const legacyMode = value?.mode || defaultLayout.mode;
  const mode = legacyMode === "scrapbook" || legacyMode === "booklet"
    ? "classic"
    : legacyMode === "kakao" || legacyMode === "dm"
      ? "messenger"
    : legacyMode === "classic" && (legacyBackground === "notebook" || legacyBackground === "manuscript")
    ? legacyBackground as LayoutMode
    : (["classic", "notebook", "document", "manuscript", "microfilm", "webcore", "bubble", "messenger"] as string[]).includes(legacyMode)
      ? legacyMode
      : defaultLayout.mode;
  return {
    ...defaultLayout,
    ...(value || {}),
    mode,
    messengerStyle: legacyMode === "dm" ? "dm" : legacyMode === "kakao" ? "kakao" : value?.messengerStyle === "dm" ? "dm" : "kakao",
    manuscriptMode: value?.manuscriptMode === "vertical" || value?.manuscriptTemplate === "vertical" ? "vertical" : "horizontal",
    manuscriptTemplate: value?.manuscriptMode === "vertical" || value?.manuscriptTemplate === "vertical" ? "vertical" : "horizontal",
    manuscriptDirection: value?.manuscriptDirection === "rtl" ? "rtl" : value?.manuscriptDirection === "ltr" ? "ltr" : value?.manuscriptMode === "vertical" || value?.manuscriptTemplate === "vertical" ? "rtl" : "ltr",
    documentSize: (["a4", "b5", "letter"] as string[]).includes(String(value?.documentSize)) ? value?.documentSize as DocumentSize : defaultLayout.documentSize,
    documentOrientation: value?.documentOrientation === "landscape" ? "landscape" : "portrait",
    documentView: value?.documentView === "editor" ? "editor" : "print",
    bookFeaturesEnabled: Boolean(value?.bookFeaturesEnabled || legacyMode === "booklet"),
    rotateOutput: Boolean(value?.rotateOutput),
    manuscriptGridX: clamp(Number(value?.manuscriptGridX ?? defaultLayout.manuscriptGridX), 0, 100),
    manuscriptGridY: clamp(Number(value?.manuscriptGridY ?? defaultLayout.manuscriptGridY), 0, 100),
    manuscriptGridWidth: clamp(Number(value?.manuscriptGridWidth ?? defaultLayout.manuscriptGridWidth), 30, 96),
    manuscriptFooterRight: !value?.manuscriptFooterRight || value.manuscriptFooterRight === "QUOTE STUDIO" ? APP_STAMP : value.manuscriptFooterRight,
    microfilmCollection: !value?.microfilmCollection || value.microfilmCollection === "ARCHIVE / QUOTE STUDIO" ? `ARCHIVE / ${APP_STAMP}` : value.microfilmCollection,
    documentHeader: !value?.documentHeader || value.documentHeader === "QUOTE STUDIO" ? APP_STAMP : value.documentHeader,
    // 원고지의 줄 사이는 격자 규격의 일부다. 이전 프로젝트에 저장된 가변값도
    // 불러올 때 표준 간격으로 되돌려 칸 비율이 무너지지 않게 한다.
    manuscriptLineGap: defaultLayout.manuscriptLineGap,
    webcoreVariant: (["notepad", "paint", "dialog", "minimal"] as string[]).includes(String(value?.webcoreVariant)) ? value?.webcoreVariant as WebcoreVariant : defaultLayout.webcoreVariant,
    webcorePalettePosition: (["none", "bottom", "left", "right"] as string[]).includes(String(value?.webcorePalettePosition)) ? value?.webcorePalettePosition as WebcorePalettePosition : defaultLayout.webcorePalettePosition,
    attributionVisible: Boolean(value?.attributionVisible),
    attributionCharacter: String(value?.attributionCharacter || ""),
    attributionCreator: String(value?.attributionCreator || value?.attributionAuthor || ""),
    attributionPlatform: String(value?.attributionPlatform || ""),
    attributionX: clamp(Number(value?.attributionX ?? defaultLayout.attributionX), 0, 100),
    attributionY: clamp(Number(value?.attributionY ?? defaultLayout.attributionY), 0, 100),
    attributionGap: value?.attributionOffsetVersion === 2 ? clamp(Number(value?.attributionGap ?? defaultLayout.attributionGap), -400, 400) : 0,
    attributionOffsetVersion: 2,
    attributionPlatformOffsetY: clamp(Number(value?.attributionPlatformOffsetY ?? defaultLayout.attributionPlatformOffsetY), 0, 100),
    mosaicExclusions: (value?.mosaicExclusions || []).filter((item) => item && typeof item.term === "string" && Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start).map((item) => ({ id: item.id || makeId("mosaic-exclusion"), term: item.term, start: Math.max(0, Number(item.start)), end: Math.max(0, Number(item.end)) })),
    dialogueShowNames: Boolean(value?.dialogueShowNames),
    headerKicker: String(value?.headerKicker ?? defaultLayout.headerKicker),
    pageTitle: String(value?.pageTitle || ""),
    pageNumberPattern: String(value?.pageNumberPattern || defaultLayout.pageNumberPattern),
    pageTitleOverrides: value?.pageTitleOverrides || {},
    pageNumberOverrides: value?.pageNumberOverrides || {},
    speakers: (value?.speakers?.length ? value.speakers : defaultSpeakers).map((speaker, index) => {
      const legacyBubbleColors: Record<string, string> = { "#dff3e8": "#8caae9", "#eef8f2": "#e8eefb", "#f7fbf9": "#f3f6fc" };
      return {
        ...speaker,
        color: legacyBubbleColors[speaker.color?.toLocaleLowerCase()] || speaker.color,
        textColor: speaker.textColor || "#171719",
        accentColor: speaker.accentColor?.toLocaleLowerCase() === "#59a881" ? "#6694ea" : speaker.accentColor || ["#788ee0", "#6694ea", "#c47e6f", "#9a72c7"][index % 4],
      };
    }),
    assignments: value?.assignments || {},
    messageMeta: value?.messageMeta || {},
  };
}

function normalizeRule(value: Partial<SyntaxRule>): SyntaxRule {
  const legacyLineStyle = String(value.lineStyle ?? "");
  const storedLineStyle = (["none", "vertical-solid", "vertical-double", "vertical-dotted", "vertical-dashed", "horizontal-short", "horizontal-double", "horizontal-dotted", "horizontal-dashed"] as string[]).includes(String(value.lineStyle))
    ? value.lineStyle as RuleLineStyle
    : legacyLineStyle === "solid" ? "vertical-solid" : legacyLineStyle === "double" ? "vertical-double" : legacyLineStyle === "horizontal-long" ? "horizontal-short" : "none";
  const normalizedLineStyle = verticalizeLineStyle(storedLineStyle);
  const requestedPresentation = String(value.presentation || "");
  return {
    ...emptyRuleDraft,
    ...value,
    id: value.id || makeId("rule"),
    fontId: normalizeStoredFontId(value.fontId, "inherit"),
    fontScale: clamp(Number(value.fontScale) || 100, 50, 240),
    highlightColor: "transparent",
    presentation: (["default", "line", "bubble", "quote"] as string[]).includes(requestedPresentation)
      ? requestedPresentation as RulePresentation
      : normalizedLineStyle !== "none" ? "line" : "default",
    lineStyle: normalizedLineStyle,
    linePosition: value.linePosition === "above" ? "above" : "below",
    lineColor: value.lineColor || emptyRuleDraft.lineColor,
  };
}

function normalizeLineStyle(value: unknown): TextLineStyle {
  const requested = String(value || "none");
  const stored = requested === "horizontal-long" ? "horizontal-short" : (["none", "vertical-solid", "vertical-double", "vertical-dotted", "vertical-dashed", "horizontal-short", "horizontal-double", "horizontal-dotted", "horizontal-dashed"] as string[]).includes(requested) ? requested as TextLineStyle : "none";
  return verticalizeLineStyle(stored);
}

function normalizeDirectMarks(values?: DirectTextMark[]) {
  return (values || []).map((mark) => ({ ...mark, kind: mark.kind === "highlight" ? "highlight" as const : "format" as const, style: { ...emptyDirectStyle, ...mark.style, fontId: normalizeStoredFontId(mark.style?.fontId, "inherit"), lineStyle: normalizeLineStyle(mark.style?.lineStyle) } }));
}

function normalizeFlowBlocks(values?: FlowBlock[]) {
  const ornamentValues = dividerOrnamentOptions.map((option) => option.value);
  return (values || []).map((block) => ({
    ...block,
    type: block.type === "vertical-divider" ? "divider" as const : block.type,
    dividerKind: block.type === "divider" || block.type === "vertical-divider" ? (["line", "ornament", "mixed"].includes(String(block.dividerKind)) ? block.dividerKind : "line") : block.dividerKind,
    dividerOrnament: ornamentValues.includes(block.dividerOrnament || "flower") ? block.dividerOrnament || "flower" : "flower",
    dividerColor: /^#[0-9a-f]{6}$/i.test(block.dividerColor || "") ? block.dividerColor : "#788ee0",
    dividerWidth: clamp(Number(block.dividerWidth ?? (block.dividerLength === "short" ? 34 : 72)), 12, 100),
    dividerThickness: clamp(Number(block.dividerThickness ?? 1), 1, 8),
    dividerSpacing: clamp(Number(block.dividerSpacing ?? 18), 0, 80),
    ornamentCount: clamp(Math.round(Number(block.ornamentCount ?? 3)), 1, 9),
    ornamentSize: clamp(Number(block.ornamentSize ?? 14), 6, 48),
    ornamentGap: clamp(Number(block.ornamentGap ?? 10), 0, 40),
  }));
}

function normalizeRules(values?: Array<Partial<SyntaxRule>>) {
  return (values || []).map(normalizeRule);
}

function ruleToDraft(value: Partial<SyntaxRule>): Omit<SyntaxRule, "id"> {
  const rule = normalizeRule(value);
  return {
    label: rule.label,
    start: rule.start,
    end: rule.end,
    role: rule.role,
    color: rule.color,
    bold: rule.bold,
    italic: rule.italic,
    removeMarkers: rule.removeMarkers,
    fontId: rule.fontId,
    fontScale: rule.fontScale,
    highlightColor: rule.highlightColor,
    presentation: rule.presentation,
    lineStyle: rule.lineStyle,
    linePosition: rule.linePosition,
    lineColor: rule.lineColor,
  };
}

function normalizeDesign(value?: Partial<DesignSettings>): DesignSettings {
  const canvasWidth = clamp(Number(value?.canvasWidth) || defaultDesign.canvasWidth, MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH);
  const canvasHeight = clamp(Number(value?.canvasHeight) || (value?.ratio ? Math.round(canvasWidth / parseRatio(value.ratio)) : defaultDesign.canvasHeight), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT);
  const legacyPadding = typeof value?.contentPadding === "number" ? Math.round(canvasWidth * value.contentPadding / 100) : defaultDesign.paddingTop;
  const requestedBackground = String(value?.backgroundMode || defaultDesign.backgroundMode);
  const backgroundMode: BackgroundMode = (["solid", "gradient", "image", "dot", "radial", "check"] as string[]).includes(requestedBackground) ? requestedBackground as BackgroundMode : "solid";
  const legacyRadial = (value || {}) as Partial<DesignSettings> & {
    radialColor?: string;
    radialSize?: number;
    radialX?: number;
    radialY?: number;
    radialShape?: "none" | "star" | "clover" | "flower";
    radialShapeColor?: string;
    radialShapeSize?: number;
    radialShapeBlur?: number;
  };
  const storedGlows = Array.isArray(value?.radialGlows) && value.radialGlows.length
    ? value.radialGlows
    : [{
        id: "glow-migrated",
        shape: legacyRadial.radialShape && legacyRadial.radialShape !== "none" ? legacyRadial.radialShape : "circle" as GlowShape,
        color: legacyRadial.radialShape && legacyRadial.radialShape !== "none" ? legacyRadial.radialShapeColor || "#6694ea" : legacyRadial.radialColor || "#6694ea",
        x: legacyRadial.radialX ?? 50,
        y: legacyRadial.radialY ?? 50,
        size: legacyRadial.radialShape && legacyRadial.radialShape !== "none" ? legacyRadial.radialShapeSize ?? 30 : legacyRadial.radialSize ?? 72,
        blur: legacyRadial.radialShape && legacyRadial.radialShape !== "none" ? legacyRadial.radialShapeBlur ?? 8 : 12,
      }];
  const radialGlows = storedGlows.map((glow, index) => {
    const normalizedColor = ["#cfeaa9", "#9fc56f"].includes(String(glow.color).toLowerCase()) ? "#6694ea" : glow.color || "#6694ea";
    return {
      id: glow.id || `glow-${index + 1}`,
      shape: (["circle", "star", "clover", "heart", "flower", "sparkle"] as string[]).includes(String(glow.shape)) ? glow.shape as GlowShape : "circle",
      color: normalizedColor,
      x: clamp(Number(glow.x ?? 50), 0, 100),
      y: clamp(Number(glow.y ?? 50), 0, 100),
      size: clamp(Number(glow.size ?? 72), 8, 140),
      blur: clamp(Number(glow.blur ?? 12), 0, 40),
    };
  });
  return {
    ...defaultDesign,
    ...(value || {}),
    backgroundMode,
    solidColor: requestedBackground === "paper" ? value?.paperColor || defaultDesign.solidColor : value?.solidColor || defaultDesign.solidColor,
    fontId: normalizeStoredFontId(value?.fontId, defaultDesign.fontId) as FontId,
    fontWeight: clamp(Math.round((Number(value?.fontWeight) || defaultDesign.fontWeight) / 100) * 100, 300, 800),
    wrapMode: ["normal", "keep-all", "break-all"].includes(String(value?.wrapMode)) ? value!.wrapMode as WrapMode : defaultDesign.wrapMode,
    canvasWidth,
    canvasHeight,
    gradientDirection: clamp(Number(value?.gradientDirection ?? defaultDesign.gradientDirection), 0, 360),
    imageScale: clamp(Number(value?.imageScale ?? defaultDesign.imageScale), 20, 300),
    imageBlur: clamp(Number(value?.imageBlur ?? defaultDesign.imageBlur), 0, 30),
    gradientStart: value?.gradientStart === "#ece9f8" ? defaultDesign.gradientStart : value?.gradientStart || defaultDesign.gradientStart,
    gradientMiddle: value?.gradientMiddle === "#e5e2f1" ? defaultDesign.gradientMiddle : value?.gradientMiddle || defaultDesign.gradientMiddle,
    gradientEnd: value?.gradientEnd === "#dce5ed" ? defaultDesign.gradientEnd : value?.gradientEnd || defaultDesign.gradientEnd,
    patternColor: value?.patternColor?.toLowerCase() === "#b7c8e7" ? defaultDesign.patternColor : value?.patternColor || defaultDesign.patternColor,
    patternSize: clamp(Number(value?.patternSize ?? defaultDesign.patternSize), 8, 400),
    dotSize: clamp(Number(value?.dotSize ?? defaultDesign.dotSize), .5, 160),
    patternStrength: clamp(Number(value?.patternStrength ?? defaultDesign.patternStrength), 1, 80),
    radialGlows,
    textScaleX: clamp(Number(value?.textScaleX ?? defaultDesign.textScaleX), 60, 160),
    textShadowBlur: clamp(Number(value?.textShadowBlur ?? defaultDesign.textShadowBlur), 0, 30),
    textColumns: clamp(Math.round(Number(value?.textColumns) || 1), 1, 4),
    columnGap: clamp(Number(value?.columnGap ?? defaultDesign.columnGap), 0, 160),
    mosaicMode: value?.mosaicMode === "blank" ? "blank" : "black",
    paddingTop: typeof value?.paddingTop === "number" ? value.paddingTop : legacyPadding,
    paddingRight: typeof value?.paddingRight === "number" ? value.paddingRight : legacyPadding,
    paddingBottom: typeof value?.paddingBottom === "number" ? value.paddingBottom : legacyPadding,
    paddingLeft: typeof value?.paddingLeft === "number" ? value.paddingLeft : legacyPadding,
  };
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function freshProject(title = "제목 없는 발췌", source = "", draft = ""): ProjectSnapshot {
  return {
    version: 2,
    id: makeId("project"),
    title,
    source,
    draft,
    rules: [],
    mosaicTerms: [],
    design: normalizeDesign(),
    layout: normalizeLayout(),
    scrapbookPages: {},
    directMarks: [],
    flowBlocks: [],
    paragraphMarks: [],
    updatedAt: Date.now(),
  };
}

const starterProject: ProjectSnapshot = {
  ...freshProject("구문 예시", sampleText, sampleText),
  id: "quote-studio-starter",
};

function countMatches(text: string, pattern: RegExp) {
  return Array.from(text.matchAll(pattern)).length;
}

function detectCandidates(text: string): Candidate[] {
  return [
    { id: "single-star", name: "별표 한 쌍", start: "*", end: "*", count: countMatches(text, /(?<!\*)\*([^*]+?)\*(?!\*)/gs), description: "*문장* 형태" },
    { id: "double-star", name: "별표 두 쌍", start: "**", end: "**", count: countMatches(text, /\*\*([\s\S]+?)\*\*/g), description: "**문장** 형태" },
    { id: "single-quotes", name: "작은따옴표", start: "'", end: "'", count: countMatches(text, /'[^'\n]+'/g), description: "'문장' 형태" },
    { id: "quotes", name: "큰따옴표", start: '"', end: '"', count: countMatches(text, /"[^"\n]+"/g), description: '"문장" 형태' },
    { id: "code-block", name: "코드 블록", start: "```", end: "```", count: countMatches(text, /```[\s\S]+?```/g), description: "삼중 백틱 영역" },
    { id: "details", name: "HTML details", start: "<details>", end: "</details>", count: countMatches(text, /<details[\s\S]+?<\/details>/gi), description: "접이식 HTML 영역" },
  ].filter((candidate) => candidate.count > 0);
}

function stripHtml(value: string) {
  if (typeof window === "undefined") return value;
  const documentValue = new DOMParser().parseFromString(value, "text/html");
  return documentValue.body.textContent?.replace(/\n{3,}/g, "\n\n").trim() ?? value;
}

function downloadFile(name: string, value: string, type: string) {
  downloadBlob(name, new Blob([value], { type }));
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("글꼴 변환 실패"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function imageFileToDataUrl(file: File, maxSide = 1400) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("이미지 읽기 실패"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("이미지를 열 수 없습니다."));
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("이미지 변환 실패"));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.84));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function inlineFontCss(cssText: string, stylesheetUrl: string) {
  const matches = Array.from(cssText.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g));
  const sources = Array.from(new Set(matches.map((match) => match[2]).filter((url) => !url.startsWith("data:"))));
  const replacements = new Map<string, string>();

  await Promise.all(sources.map(async (sourceUrl) => {
    const absoluteUrl = new URL(sourceUrl, stylesheetUrl).href;
    const response = await fetch(absoluteUrl);
    if (!response.ok) throw new Error(`글꼴 파일을 불러오지 못했습니다: ${response.status}`);
    replacements.set(sourceUrl, await blobToDataUrl(await response.blob()));
  }));

  let output = cssText;
  replacements.forEach((dataUrl, sourceUrl) => {
    output = output.split(sourceUrl).join(dataUrl);
  });
  return output;
}

function findTextMatches(text: string, term: string, caseSensitive = false) {
  if (!term) return [] as number[];
  const haystack = caseSensitive ? text : text.toLocaleLowerCase();
  const needle = caseSensitive ? term : term.toLocaleLowerCase();
  const matches: number[] = [];
  let cursor = haystack.indexOf(needle);
  while (cursor >= 0) {
    matches.push(cursor);
    cursor = haystack.indexOf(needle, cursor + Math.max(1, needle.length));
  }
  return matches;
}

function isMosaicExcluded(exclusions: MosaicExclusion[], term: string, start: number, end: number) {
  return exclusions.some((item) => item.start === start && item.end === end && item.term.toLocaleLowerCase() === term.toLocaleLowerCase());
}

function renderMosaic(text: string, terms: string[], exclusions: MosaicExclusion[], keyPrefix: string, baseOffset = 0): ReactNode[] {
  const filtered = terms.filter(Boolean).sort((a, b) => b.length - a.length);
  if (!filtered.length) return [text];
  const escaped = filtered.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escaped.join("|")})`, "gi");
  let cursor = 0;
  return text.split(matcher).map((part, index) => {
    const partStart = cursor;
    cursor += part.length;
    const hidden = filtered.some((term) => term.toLowerCase() === part.toLowerCase());
    const excluded = hidden && isMosaicExcluded(exclusions, part, baseOffset + partStart, baseOffset + cursor);
    return hidden && !excluded ? <span className="mosaic-text" aria-label="가려진 텍스트" key={`${keyPrefix}-${index}`}>{part}</span> : part;
  });
}

function parseSegments(text: string, rules: SyntaxRule[]): ParsedSegment[] {
  const activeRules = rules.filter((rule) => rule.start && rule.end);
  const output: ParsedSegment[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let selectedRule: SyntaxRule | null = null;
    let selectedStart = -1;
    let selectedEnd = -1;
    for (const rule of activeRules) {
      const startIndex = text.indexOf(rule.start, cursor);
      if (startIndex < 0) continue;
      const contentStart = startIndex + rule.start.length;
      const endIndex = text.indexOf(rule.end, contentStart);
      if (endIndex < 0) continue;
      if (selectedStart < 0 || startIndex < selectedStart || (startIndex === selectedStart && rule.start.length > (selectedRule?.start.length ?? 0))) {
        selectedRule = rule;
        selectedStart = startIndex;
        selectedEnd = endIndex;
      }
    }
    if (!selectedRule || selectedStart < 0) {
      output.push({ text: text.slice(cursor), rule: null, start: cursor, end: text.length });
      break;
    }
    if (selectedStart > cursor) output.push({ text: text.slice(cursor, selectedStart), rule: null, start: cursor, end: selectedStart });
    const innerStart = selectedStart + selectedRule.start.length;
    const inner = text.slice(innerStart, selectedEnd);
    const visibleStart = selectedRule.removeMarkers ? innerStart : selectedStart;
    const visibleEnd = selectedRule.removeMarkers ? selectedEnd : selectedEnd + selectedRule.end.length;
    output.push({
      text: `${selectedRule.removeMarkers ? "" : selectedRule.start}${inner}${selectedRule.removeMarkers ? "" : selectedRule.end}`,
      rule: selectedRule,
      start: visibleStart,
      end: visibleEnd,
    });
    cursor = selectedEnd + selectedRule.end.length;
  }
  return output;
}

function ruleClassNames(rule: SyntaxRule) {
  const lineClasses = rule.presentation === "line" || rule.presentation === "quote" || rule.role === "dialogue" ? [] : [`line-${rule.lineStyle}`, `line-position-${rule.linePosition}`];
  return ["styled-segment", `role-${rule.role}`, ...lineClasses, rule.bold ? "is-bold" : "", rule.italic ? "is-italic" : ""].filter(Boolean).join(" ");
}

function directClassNames(style: DirectTextStyle) {
  return ["direct-segment", `line-${style.lineStyle}`, `line-position-${style.linePosition}`, style.bold ? "is-bold" : "", style.italic ? "is-italic" : ""].filter(Boolean).join(" ");
}

function getFontFamily(fontId: FontId | "inherit") {
  if (fontId === "inherit") return "inherit";
  return fontOptions.find((font) => font.id === fontId)?.family || "inherit";
}

function getManuscriptFontOffset(fontId: FontId | "inherit") {
  if (fontId === "inherit") return 0;
  return fontOptions.find((font) => font.id === fontId)?.manuscriptOffsetEm ?? 0;
}

function ruleStyle(rule: SyntaxRule): CSSProperties {
  return {
    color: rule.color,
    fontFamily: getFontFamily(rule.fontId),
    fontSize: `${rule.fontScale / 100}em`,
    "--line-color": rule.lineColor || emptyRuleDraft.lineColor,
  } as CSSProperties;
}

function directStyle(style: DirectTextStyle): CSSProperties {
  return {
    color: style.color,
    fontFamily: getFontFamily(style.fontId),
    fontSize: `${style.fontScale / 100}em`,
    backgroundColor: style.highlightColor === "transparent" ? undefined : style.highlightColor,
    "--line-color": style.lineColor || emptyDirectStyle.lineColor,
  } as CSSProperties;
}

function directFormatStyle(style: DirectTextStyle): CSSProperties {
  return { ...directStyle(style), backgroundColor: undefined };
}

function renderInline(text: string, rules: SyntaxRule[], mosaicTerms: string[], keyPrefix: string, directMarks: DirectTextMark[] = [], baseOffset = 0, layout?: LayoutSettings): ReactNode[] {
  return parseSegments(text, rules).flatMap((segment, segmentIndex) => {
    const segmentGlobalStart = baseOffset + segment.start;
    const segmentGlobalEnd = baseOffset + segment.end;
    const intersecting = directMarks.filter((mark) => mark.start < segmentGlobalEnd && mark.end > segmentGlobalStart);
    const boundaries = Array.from(new Set([0, segment.text.length, ...intersecting.flatMap((mark) => [
      clamp(mark.start - segmentGlobalStart, 0, segment.text.length),
      clamp(mark.end - segmentGlobalStart, 0, segment.text.length),
    ])])).sort((a, b) => a - b);
    return boundaries.slice(0, -1).map((sliceStart, sliceIndex) => {
      const sliceEnd = boundaries[sliceIndex + 1];
      if (sliceEnd <= sliceStart) return null;
      const absoluteStart = segmentGlobalStart + sliceStart;
      const coveringMarks = intersecting.filter((item) => item.start <= absoluteStart && item.end >= segmentGlobalStart + sliceEnd);
      const formatMark = [...coveringMarks].reverse().find((item) => item.kind !== "highlight");
      const highlightMark = [...coveringMarks].reverse().find((item) => item.kind === "highlight");
      const highlightColor = highlightMark?.style.highlightColor || formatMark?.style.highlightColor || "transparent";
      const content = renderMosaic(segment.text.slice(sliceStart, sliceEnd), mosaicTerms, layout?.mosaicExclusions || [], `${keyPrefix}-${segmentIndex}-${sliceIndex}`, segmentGlobalStart + sliceStart);
      const highlightedContent = highlightColor !== "transparent" ? <span className="direct-highlight" style={{ backgroundColor: highlightColor }}>{content}</span> : content;
      const directlyFormattedContent = formatMark ? <span className={directClassNames(formatMark.style)} style={directFormatStyle(formatMark.style)}>{highlightedContent}</span> : highlightedContent;
      const combinedNode = segment.rule ? <span className={ruleClassNames(segment.rule)} style={ruleStyle(segment.rule)} title={segment.rule.label}>{directlyFormattedContent}</span> : directlyFormattedContent;
      if (!formatMark) return <span key={`${keyPrefix}-${segmentIndex}-${sliceIndex}`}>{combinedNode}</span>;
      const speaker = layout?.speakers.find((item) => item.id === formatMark.style.bubbleSpeakerId);
      if (layout?.mode === "bubble" && speaker) {
        return <span className={`inline-dialogue-wrap side-${speaker.side}`} key={`${keyPrefix}-bubble-${formatMark.id}-${sliceIndex}`}><span className="inline-dialogue-name">{speaker.name}</span><span className="inline-dialogue-line"><span className="inline-dialogue-bubble" style={{ "--bubble-color": speaker.color, color: speaker.textColor } as CSSProperties}>{combinedNode}</span>{(formatMark.style.time || formatMark.style.readStatus) && <small>{formatMark.style.readStatus} {formatMessageTime(formatMark.style.time)}</small>}</span></span>;
      }
      return <span key={`${keyPrefix}-direct-${formatMark.id}-${sliceIndex}`}>{combinedNode}</span>;
    }).filter(Boolean) as ReactNode[];
  });
}

function describeTextPosition(text: string, anchor: number) {
  const paragraphs = splitParagraphsWithOffsets(text);
  if (!paragraphs.length) return "수정본 시작";
  const safeAnchor = clamp(anchor, 0, text.length);
  const exactIndex = paragraphs.findIndex((paragraph) => paragraph.start === safeAnchor);
  if (exactIndex >= 0) return `${exactIndex + 1}번째 문단 앞`;
  const containingIndex = paragraphs.findIndex((paragraph, index) => {
    const nextStart = paragraphs[index + 1]?.start ?? text.length + 1;
    return safeAnchor > paragraph.start && safeAnchor < nextStart;
  });
  if (containingIndex >= 0) return `${containingIndex + 1}번째 문단 안`;
  return safeAnchor <= paragraphs[0].start ? "첫 문단 앞" : "마지막 문단 뒤";
}

function DividerOrnamentSvg({ type }: { type: DividerOrnament }) {
  if (type === "flower") return <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><ellipse cx="12" cy="5.5" rx="3" ry="4" /><ellipse cx="18.2" cy="10" rx="3" ry="4" transform="rotate(72 18.2 10)" /><ellipse cx="15.8" cy="17.3" rx="3" ry="4" transform="rotate(144 15.8 17.3)" /><ellipse cx="8.2" cy="17.3" rx="3" ry="4" transform="rotate(216 8.2 17.3)" /><ellipse cx="5.8" cy="10" rx="3" ry="4" transform="rotate(288 5.8 10)" /><circle cx="12" cy="12" r="2.7" /></g></svg>;
  if (type === "clover") return <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="8.4" cy="8.4" r="4.6" /><circle cx="15.6" cy="8.4" r="4.6" /><circle cx="8.4" cy="15.6" r="4.6" /><circle cx="15.6" cy="15.6" r="4.6" /><circle cx="12" cy="12" r="2.8" /></g></svg>;
  if (type === "star") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.7 2.7 5.7 6.2.8-4.6 4.3 1.2 6.1-5.5-3-5.5 3 1.2-6.1-4.6-4.3 6.2-.8Z" fill="currentColor" /></svg>;
  if (type === "sparkle") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8c.8 6.6 2.8 8.8 9.2 10.2-6.4 1.4-8.4 3.6-9.2 10.2C11.2 15.6 9.2 13.4 2.8 12 9.2 10.6 11.2 8.4 12 1.8Z" fill="currentColor" /></svg>;
  if (type === "asterisk") return <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /></g></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" fill="currentColor" /></svg>;
}

function GlowShapeSvg({ type }: { type: GlowShape }) {
  if (type === "circle") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor" /></svg>;
  if (type === "heart") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 4.4 13.7C-.2 9.3 2.1 3 7.5 3c2.1 0 3.7 1.1 4.5 2.5C12.8 4.1 14.4 3 16.5 3c5.4 0 7.7 6.3 3.1 10.7Z" fill="currentColor" /></svg>;
  return <DividerOrnamentSvg type={type} />;
}

function renderFlowBlock(block: FlowBlock) {
  const align = block.align || "left";
  if (block.type === "title") return <h2 className="flow-title" style={{ textAlign: align }} key={block.id}>{block.text || "제목"}</h2>;
  if (block.type === "subtitle") return <h3 className="flow-subtitle" style={{ textAlign: align }} key={block.id}>{block.text || "부제"}</h3>;
  if (block.type === "image" && block.src) {
    const placement = block.placement || "flow";
    return <figure className={`flow-image placement-${placement}`} style={{ width: `${block.width || 72}%`, marginInline: placement === "flow" ? (align === "center" ? "auto" : align === "right" ? "auto 0" : "0 auto") : undefined }} key={block.id}><img src={block.src} alt="사용자가 삽입한 사진" draggable={false} /></figure>;
  }
  if (block.type === "divider") {
    const sharedStyle = {
      "--divider-color": block.dividerColor || "#788ee0",
      "--divider-width": `${block.dividerWidth ?? (block.dividerLength === "short" ? 34 : 72)}%`,
      "--divider-thickness": `${block.dividerThickness ?? 1}px`,
      "--divider-spacing": `${block.dividerSpacing ?? 18}px`,
      marginInline: align === "center" ? "auto" : align === "right" ? "auto 0" : "0 auto",
    } as CSSProperties;
    if (block.dividerKind === "ornament") {
      const count = clamp(Math.round(block.ornamentCount ?? 3), 1, 9);
      return <div className="flow-divider-ornament" style={{ ...sharedStyle, "--ornament-size": `${block.ornamentSize ?? 14}px`, "--ornament-gap": `${block.ornamentGap ?? 10}px` } as CSSProperties} key={block.id}>{Array.from({ length: count }, (_, index) => <DividerOrnamentSvg type={block.dividerOrnament || "flower"} key={`${block.id}-${index}`} />)}</div>;
    }
    if (block.dividerKind === "mixed") return <div className={`flow-divider-mixed is-${block.dividerStyle || "solid"}`} style={{ ...sharedStyle, "--ornament-size": `${block.ornamentSize ?? 14}px`, "--ornament-gap": `${block.ornamentGap ?? 10}px` } as CSSProperties} key={block.id}><i /><DividerOrnamentSvg type={block.dividerOrnament || "flower"} /><i /></div>;
    return <div className={`flow-divider is-${block.dividerStyle || "solid"}`} style={sharedStyle} key={block.id} />;
  }
  if (block.type === "vertical-divider") return <div className="flow-vertical-divider" style={{ marginInline: align === "right" ? "auto 0" : align === "center" ? "auto" : "0 auto" }} key={block.id} />;
  return null;
}

function PreviewText({ text, rules, mosaicTerms, paragraphIndent = false, directMarks = [], flowBlocks = [], paragraphMarks = [], baseOffset = 0, layout }: { text: string; rules: SyntaxRule[]; mosaicTerms: string[]; paragraphIndent?: boolean; directMarks?: DirectTextMark[]; flowBlocks?: FlowBlock[]; paragraphMarks?: ParagraphMark[]; baseOffset?: number; layout?: LayoutSettings }) {
  const paragraphs = splitParagraphsWithOffsets(text);
  const pageBlocks = flowBlocks.filter((block) => block.anchor >= baseOffset && block.anchor <= baseOffset + text.length).sort((a, b) => a.anchor - b.anchor);
  const renderedBlocks = new Set<string>();
  const nodes: ReactNode[] = [];
  paragraphs.forEach((paragraph, index) => {
    pageBlocks.filter((block) => !renderedBlocks.has(block.id) && block.anchor <= baseOffset + paragraph.start).forEach((block) => { nodes.push(renderFlowBlock(block)); renderedBlocks.add(block.id); });
    if (paragraph.blankLinesBefore > 0) nodes.push(<span className="manual-blank-lines" style={{ height: `${paragraph.blankLinesBefore}lh` }} aria-hidden="true" key={`blank-lines-${baseOffset}-${index}`} />);
    const globalParagraphStart = baseOffset + paragraph.start;
    const parsedParagraph = parseSegments(paragraph.text, rules);
    const presentationRule = parsedParagraph.find((segment) => segment.rule?.presentation && segment.rule.presentation !== "default")?.rule;
    const paragraphMark = paragraphMarks.find((mark) => mark.start === globalParagraphStart);
    const assignmentKey = `text:${globalParagraphStart}`;
    const dialogueSpeaker = layout?.speakers.find((speaker) => speaker.id === layout.assignments[assignmentKey]);
    const presentation = paragraphMark?.presentation || presentationRule?.presentation;
    const paragraphLineStyle = presentation === "line" || presentation === "quote" ? (paragraphMark?.lineStyle || (presentationRule?.lineStyle === "none" || !presentationRule?.lineStyle ? "vertical-solid" : presentationRule.lineStyle)) : "none";
    const linePosition = paragraphMark?.linePosition || presentationRule?.linePosition || "below";
    const paragraphClasses = [
      paragraphMark?.role ? `paragraph-role-${paragraphMark.role}` : "",
      presentation ? `paragraph-presentation-${presentation}` : "",
      paragraphMark?.color ? "has-paragraph-color" : "",
      paragraphMark?.bold ? "paragraph-is-bold" : "",
      paragraphMark?.italic ? "paragraph-is-italic" : "",
      paragraphLineStyle !== "none" ? `has-dialogue-line dialogue-line-${paragraphLineStyle} line-position-${linePosition}` : "",
    ].filter(Boolean).join(" ");
    const presentationColor = paragraphMark?.presentationColor || dialogueSpeaker?.accentColor || presentationRule?.lineColor || "#6694ea";
    const paragraphStyle = paragraphMark || presentationRule || presentation ? {
      color: paragraphMark?.color,
      "--dialogue-line-color": presentationColor,
      "--paragraph-presentation-color": presentationColor,
    } as CSSProperties : undefined;
    nodes.push(<p className={paragraphClasses || undefined} style={paragraphStyle} key={`paragraph-${baseOffset}-${index}`}>{layout?.dialogueShowNames && dialogueSpeaker && <span className="dialogue-character-name">{dialogueSpeaker.name}</span>}{renderInline(paragraph.text, rules, mosaicTerms, `paragraph-${baseOffset}-${index}`, directMarks, globalParagraphStart, layout)}</p>);
  });
  pageBlocks.filter((block) => !renderedBlocks.has(block.id)).forEach((block) => nodes.push(renderFlowBlock(block)));
  return <div className={`preview-copy ${paragraphIndent ? "with-indent" : ""}`}>{nodes}</div>;
}

function ManuscriptPreview({ page, rules, mosaicTerms, columns, rows, title, pageNumber, surface, layout, directMarks, flowBlocks }: { page: PageItem; rules: SyntaxRule[]; mosaicTerms: string[]; columns: number; rows: number; title: string; pageNumber: number; surface: SurfaceSize; layout: LayoutSettings; directMarks: DirectTextMark[]; flowBlocks: FlowBlock[] }) {
  const text = page.text;
  const tokens = parseSegments(text, rules).flatMap((segment) => {
    let relativeOffset = segment.start;
    return Array.from(segment.text).map((character) => {
      const absoluteOffset = page.startOffset + relativeOffset;
      let appliedDirectStyle: DirectTextStyle | null = null;
      let appliedHighlightColor = "transparent";
      for (const mark of directMarks) {
        if (mark.start <= absoluteOffset && mark.end > absoluteOffset) {
          if (mark.kind === "highlight") appliedHighlightColor = mark.style.highlightColor;
          else {
            appliedDirectStyle = mark.style;
            if (mark.style.highlightColor !== "transparent") appliedHighlightColor = mark.style.highlightColor;
          }
        }
      }
      relativeOffset += character.length;
      return { character, rule: segment.rule, directStyle: appliedDirectStyle, highlightColor: appliedHighlightColor, absoluteOffset };
    });
  });
  const visibleText = tokens.map((token) => token.character).join("");
  const hiddenIndexes = new Set<number>();
  for (const term of mosaicTerms.filter(Boolean)) {
    const target = term.toLocaleLowerCase();
    const haystack = visibleText.toLocaleLowerCase();
    let start = haystack.indexOf(target);
    while (start >= 0) {
      const absoluteStart = tokens[start]?.absoluteOffset ?? page.startOffset + start;
      const excluded = isMosaicExcluded(layout.mosaicExclusions, term, absoluteStart, absoluteStart + term.length);
      if (!excluded) for (let index = start; index < start + term.length; index += 1) hiddenIndexes.add(index);
      start = haystack.indexOf(target, start + Math.max(1, term.length));
    }
  }
  const cells: ReactNode[] = [];
  let linePosition = 0;
  let cellIndex = 0;
  let previousWasLineBreak = false;
  const capacity = columns * rows;
  const vertical = layout.manuscriptMode === "vertical";
  const lineLength = vertical ? rows : columns;
  const blanks = (amount: number) => {
    for (let index = 0; index < amount && cells.length < capacity; index += 1) cells.push(<span className="manuscript-cell is-empty" aria-hidden="true" key={`blank-${cellIndex++}`} />);
  };
  for (let tokenIndex = 0; tokenIndex < tokens.length && cells.length < capacity; tokenIndex += 1) {
    const token = tokens[tokenIndex];
    const isCarriageReturnBeforeNewline = token.character === "\r" && tokens[tokenIndex + 1]?.character === "\n";
    if (isCarriageReturnBeforeNewline) continue;
    if (token.character === "\n" || token.character === "\r") {
      if (linePosition > 0) blanks(lineLength - linePosition);
      else if (cells.length === 0 || previousWasLineBreak) blanks(lineLength);
      linePosition = 0;
      previousWasLineBreak = true;
      continue;
    }
    const className = ["manuscript-cell", token.rule ? ruleClassNames(token.rule) : "", token.directStyle ? directClassNames(token.directStyle) : "", hiddenIndexes.has(tokenIndex) ? "is-mosaic" : ""].filter(Boolean).join(" ");
    const combinedStyle = { ...(token.rule ? ruleStyle(token.rule) : {}), ...(token.directStyle ? directFormatStyle(token.directStyle) : {}), ...(token.highlightColor !== "transparent" ? { backgroundColor: token.highlightColor } : {}) } as CSSProperties;
    const { fontSize, ...cellStyle } = combinedStyle;
    const directFontId = token.directStyle?.fontId;
    const ruleFontId = token.rule?.fontId;
    const markedFontId = directFontId && directFontId !== "inherit" ? directFontId : ruleFontId && ruleFontId !== "inherit" ? ruleFontId : "inherit";
    const manuscriptCellStyle = { ...cellStyle, ...(markedFontId !== "inherit" ? { "--manuscript-character-offset": `${getManuscriptFontOffset(markedFontId)}em` } : {}) } as CSSProperties;
    const hasStyle = Boolean(token.rule || token.directStyle);
    cells.push(<span className={className} style={hasStyle ? manuscriptCellStyle : undefined} title={token.rule?.label || (token.directStyle ? "직접 서식" : undefined)} key={`cell-${cellIndex++}`}><span className="manuscript-character" style={fontSize ? { fontSize } : undefined}>{token.character === " " ? "\u00a0" : token.character}</span></span>);
    linePosition = (linePosition + 1) % lineLength;
    previousWasLineBreak = false;
  }
  blanks(capacity - cells.length);
  const pageImages = flowBlocks.filter((block) => block.type === "image" && block.anchor >= page.startOffset && block.anchor <= page.startOffset + page.text.length);
  return <div className={`manuscript-sheet surface-${surface} template-${vertical ? "vertical" : "horizontal"} direction-${layout.manuscriptDirection} ${layout.manuscriptShowHeader ? "has-header" : ""} ${layout.manuscriptShowFooter ? "has-footer" : ""}`} style={{ "--manuscript-grid-color": layout.manuscriptGridColor, "--manuscript-grid-x": `${layout.manuscriptGridX}%`, "--manuscript-grid-y": `${layout.manuscriptGridY}%`, "--manuscript-grid-shift-x": `${-layout.manuscriptGridX}%`, "--manuscript-grid-shift-y": `${-layout.manuscriptGridY}%`, "--manuscript-grid-width": `${layout.manuscriptGridWidth}%` } as CSSProperties}>
    {layout.manuscriptShowHeader && <div className={`manuscript-form-header ${layout.manuscriptShowPageNumber ? "has-sheet-number" : "no-sheet-number"}`}><span>{layout.manuscriptTitleLabel}</span><b>{layout.manuscriptTitle || title || "제목 없는 발췌"}</b>{layout.manuscriptShowPageNumber && <><span>{layout.manuscriptSheetLabel}</span><b>{String(pageNumber).padStart(2, "0")}</b></>}</div>}
    <div className="manuscript-grid" style={{ "--manuscript-columns": columns, "--manuscript-rows": rows } as CSSProperties}>{cells}</div>
    {pageImages.length > 0 && <div className="manuscript-media">{pageImages.map(renderFlowBlock)}</div>}
    {layout.manuscriptShowFooter && <div className="manuscript-footer"><span>{layout.manuscriptFooterLeft}</span><i>{layout.manuscriptFooterRight}</i></div>}
  </div>;
}

function NotebookPreview({ page, pageNumber, rules, mosaicTerms, layout, directMarks, flowBlocks, paragraphMarks }: { page: PageItem; pageNumber: number; rules: SyntaxRule[]; mosaicTerms: string[]; layout: LayoutSettings; directMarks: DirectTextMark[]; flowBlocks: FlowBlock[]; paragraphMarks: ParagraphMark[] }) {
  return <div className={`notebook-sheet pattern-${layout.notebookPattern}`}>
    {layout.notebookDate && <div className="notebook-meta"><time>{layout.notebookDate}</time></div>}
    <div className="notebook-copy"><PreviewText text={page.text} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} baseOffset={page.startOffset} layout={layout} /></div>
    <div className="notebook-page-number"><span>{layout.notebookMeta}</span><b>{String(pageNumber).padStart(2, "0")}</b></div>
  </div>;
}

function MicrofilmPreview({ page, pageNumber, rules, mosaicTerms, layout, directMarks, flowBlocks, paragraphMarks }: { page: PageItem; pageNumber: number; rules: SyntaxRule[]; mosaicTerms: string[]; layout: LayoutSettings; directMarks: DirectTextMark[]; flowBlocks: FlowBlock[]; paragraphMarks: ParagraphMark[] }) {
  return <div className={`microfilm-sheet columns-${layout.microfilmColumns} body-${layout.microfilmBodyAlign}`}>
    <div className="microfilm-perforation is-top" aria-hidden="true" />
    <div className="microfilm-header"><span>{layout.microfilmCollection}</span><b>{layout.microfilmFrame || `FRAME ${String(pageNumber).padStart(3, "0")}`}</b><time>{layout.microfilmDate}</time></div>
    <div className="microfilm-frame"><PreviewText text={page.text} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} baseOffset={page.startOffset} layout={layout} /></div>
    <div className="microfilm-footer"><span>{layout.microfilmCaption}</span><b>{String(pageNumber).padStart(3, "0")}</b></div>
    <div className="microfilm-perforation is-bottom" aria-hidden="true" />
  </div>;
}

function DocumentPreview({ page, pageNumber, totalPages, title, rules, mosaicTerms, layout, directMarks, flowBlocks, paragraphMarks }: { page: PageItem; pageNumber: number; totalPages: number; title: string; rules: SyntaxRule[]; mosaicTerms: string[]; layout: LayoutSettings; directMarks: DirectTextMark[]; flowBlocks: FlowBlock[]; paragraphMarks: ParagraphMark[] }) {
  const copy = <PreviewText text={page.text} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} baseOffset={page.startOffset} layout={layout} />;
  if (layout.documentView === "editor") {
    return <article className="document-sheet view-office">
      <div className="office-app-chrome">
        <div className="office-titlebar">
          <span className="office-file-icon" aria-hidden="true" />
          <b>[{layout.documentFileName || "새 문서"}]</b>
          <div aria-hidden="true"><i>□</i><i>☰</i></div>
        </div>
        <div className="office-menu">파일　편집　보기　삽입　서식</div>
        {layout.documentShowRulers && <div className="office-ruler horizontal" aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</div>}
      </div>
      <div className={`office-workspace ${layout.documentShowRulers ? "has-rulers" : ""}`}>
        {layout.documentShowRulers && <div className="office-ruler vertical" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div>}
        <div className="office-document">
          {layout.documentShowHeader && <div className="office-document-meta"><span>{layout.documentHeader || title || "정리 중인 원고"}</span><b>{String(pageNumber).padStart(2, "0")}</b></div>}
          <div className="office-paper"><div className="office-paper-copy">{copy}</div></div>
          {layout.documentShowFooter && <div className="office-document-footer"><span>{layout.documentFooter}</span><b>{pageNumber} / {totalPages}</b></div>}
        </div>
      </div>
    </article>;
  }
  return <article className="document-sheet view-proof">
    <span className="document-edit-mark corner-tl" aria-hidden="true" />
    <span className="document-edit-mark corner-tr" aria-hidden="true" />
    <span className="document-edit-mark corner-bl" aria-hidden="true" />
    <span className="document-edit-mark corner-br" aria-hidden="true" />
    <div className="proof-registration top" aria-hidden="true" />
    <div className="proof-registration left" aria-hidden="true" />
    <div className="proof-registration right" aria-hidden="true" />
    <div className="proof-registration bottom" aria-hidden="true" />
    <div className="proof-file-meta"><b>[{layout.documentFileName || "새 문서"}]</b></div>
    {layout.documentShowHeader && <header><span>{layout.documentHeader || title || "정리 중인 원고"}</span><b>PAGE {String(pageNumber).padStart(2, "0")}</b></header>}
    <div className="document-workarea"><div className="document-copy">{copy}</div></div>
    {layout.documentShowFooter && <footer><span>{layout.documentFooter}</span><b>{pageNumber} / {totalPages}</b></footer>}
  </article>;
}

function WebcorePreview({ page, rules, mosaicTerms, layout, directMarks, flowBlocks, paragraphMarks }: { page: PageItem; rules: SyntaxRule[]; mosaicTerms: string[]; layout: LayoutSettings; directMarks: DirectTextMark[]; flowBlocks: FlowBlock[]; paragraphMarks: ParagraphMark[] }) {
  const windowTitle = [layout.webcoreFileName.trim(), layout.webcoreTitle.trim()].filter(Boolean).join(" - ") || "Untitled";
  return <div className="webcore-shell variant-notepad" style={{ "--webcore-window": "#c0c0c0", "--webcore-title": "#000080", "--webcore-body": "#ffffff", "--webcore-text": "var(--preview-text)" } as CSSProperties}>
    <div className="webcore-titlebar"><span>▣</span><b>{windowTitle}</b><div aria-hidden="true"><i>_</i><i>□</i><i>×</i></div></div>
    <div className="webcore-menu">{layout.webcoreMenu || "File   Edit   Search   Help"}</div>
    <div className="webcore-content"><PreviewText text={page.text} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} baseOffset={page.startOffset} layout={layout} /></div>
    {layout.webcoreShowScrollbars && <><div className="webcore-scrollbar vertical" aria-hidden="true"><i>▲</i><span /><i>▼</i></div><div className="webcore-scrollbar horizontal" aria-hidden="true"><i>◀</i><span /><i>▶</i></div></>}
  </div>;
}

function splitLongBlock(block: string, limit: number) {
  const chunks: string[] = [];
  let rest = block;
  while (rest.length > limit) {
    const windowText = rest.slice(0, limit + 1);
    const candidates = [windowText.lastIndexOf(". "), windowText.lastIndexOf("다. "), windowText.lastIndexOf("! "), windowText.lastIndexOf("? "), windowText.lastIndexOf(" ")];
    const cut = Math.max(...candidates);
    const safeCut = cut > limit * 0.55 ? cut + 1 : limit;
    // Page splitting must not normalize user-entered whitespace. In particular,
    // a leading newline is meaningful when a paragraph is intentionally
    // positioned below the top edge of the canvas.
    chunks.push(rest.slice(0, safeCut));
    rest = rest.slice(safeCut);
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function paginateText(text: string, automatic: boolean, capacity: number): PageItem[] {
  const manualGroups = text.split(/\n{0,2}--- 페이지 나누기 ---\n{0,2}/g);
  const pages: PageItem[] = [];
  manualGroups.forEach((group, manualIndex) => {
    // Keep the group's whitespace verbatim. `trim()` used to erase blank lines
    // at the beginning of a page before PreviewText had a chance to render
    // them as manual line-height spacers.
    const pageText = group.replace(/\r\n?/g, "\n");
    if (!automatic || pageText.length <= capacity) {
      pages.push({ id: `manual-${manualIndex}-0`, text: pageText, sourceIndex: pages.length, startOffset: 0 });
      return;
    }
    const sections: Array<{ text: string; separatorBefore: string }> = [];
    let sectionCursor = 0;
    let separatorBefore = "";
    for (const match of pageText.matchAll(/\n{2,}/g)) {
      const paragraph = pageText.slice(sectionCursor, match.index);
      if (paragraph) sections.push({ text: paragraph, separatorBefore });
      separatorBefore = match[0];
      sectionCursor = (match.index ?? 0) + match[0].length;
    }
    const trailingParagraph = pageText.slice(sectionCursor);
    if (trailingParagraph) sections.push({ text: trailingParagraph, separatorBefore });
    const paragraphs = sections.flatMap((section) => {
      const chunks = section.text.length > capacity ? splitLongBlock(section.text, capacity) : [section.text];
      return chunks.map((paragraph, chunkIndex) => ({ text: paragraph, separatorBefore: chunkIndex === 0 ? section.separatorBefore : "\n\n" }));
    });
    let current = "";
    let part = 0;
    paragraphs.forEach((paragraph) => {
      const preservedParagraph = `${paragraph.separatorBefore}${paragraph.text}`;
      const next = current ? `${current}${paragraph.separatorBefore || "\n\n"}${paragraph.text}` : preservedParagraph;
      if (current && next.length > capacity) {
        pages.push({ id: `manual-${manualIndex}-${part++}`, text: current, sourceIndex: pages.length, startOffset: 0 });
        current = preservedParagraph;
      } else current = next;
    });
    pages.push({ id: `manual-${manualIndex}-${part}`, text: current, sourceIndex: pages.length, startOffset: 0 });
  });
  let cursor = 0;
  pages.forEach((page) => {
    const located = page.text ? text.indexOf(page.text, cursor) : cursor;
    page.startOffset = located >= 0 ? located : cursor;
    cursor = Math.max(cursor, page.startOffset + page.text.length);
  });
  return pages.length ? pages : [{ id: "manual-0-0", text: "", sourceIndex: 0, startOffset: 0 }];
}

function estimateCanvasCapacity(design: DesignSettings, layout: LayoutSettings) {
  const size = getOutputSize(design, layout);
  const horizontalPadding = design.paddingLeft + design.paddingRight;
  const verticalPadding = design.paddingTop + design.paddingBottom;
  const messengerRatio = layout.mode === "messenger" ? 0.72 : 1;
  const headerReserve = design.showHeader && ["classic", "bubble"].includes(layout.mode) ? 56 : 0;
  const usableWidth = Math.max(80, size.width - horizontalPadding);
  const usableHeight = Math.max(80, (size.height - verticalPadding - headerReserve) * messengerRatio);
  const averageGlyphWidth = Math.max(6, design.fontSize * (design.letterSpacing + 0.92));
  const charactersPerLine = Math.max(4, Math.floor(usableWidth / averageGlyphWidth));
  const lines = Math.max(2, Math.floor(usableHeight / Math.max(8, design.fontSize * design.lineHeight)));
  return clamp(Math.floor(charactersPerLine * lines * 0.86), 120, 6000);
}

type OutputSize = { width: number; height: number; label: string; fixed: boolean };

function parseRatio(ratio: string) {
  const [width, height] = ratio.split("/").map((value) => Number(value.trim()));
  return width > 0 && height > 0 ? width / height : 4 / 5;
}

function getOutputSize(design: DesignSettings, layout: LayoutSettings): OutputSize {
  let output: OutputSize;
  if (layout.mode === "messenger") {
    output = design.surfaceSize === "banner"
      ? { width: 540, height: 1170, label: layout.messengerStyle === "kakao" ? "카톡 긴 화면" : "DM 긴 화면", fixed: true }
      : { width: 540, height: 960, label: layout.messengerStyle === "kakao" ? "카톡 휴대폰 캡처" : "DM 휴대폰 캡처", fixed: true };
  } else if (layout.mode === "manuscript") {
    output = {
      width: clamp(Math.round(design.canvasWidth), MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH),
      height: clamp(Math.round(design.canvasHeight), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
      label: "자유 규격 원고지",
      fixed: false,
    };
  } else if (layout.mode === "notebook") {
    output = {
      width: clamp(Math.round(design.canvasWidth), MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH),
      height: clamp(Math.round(design.canvasHeight), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
      label: "자유 규격 노트",
      fixed: false,
    };
  } else if (layout.mode === "microfilm") {
    output = {
      width: clamp(Math.round(design.canvasWidth), MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH),
      height: clamp(Math.round(design.canvasHeight), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
      label: design.surfaceSize === "banner" ? "자유 규격 마이크로필름 스트립" : "자유 규격 마이크로필름 프레임",
      fixed: false,
    };
  } else if (layout.mode === "document") {
    output = {
      width: clamp(Math.round(design.canvasWidth), MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH),
      height: clamp(Math.round(design.canvasHeight), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
      label: "자유 규격 문서",
      fixed: false,
    };
  } else if (layout.mode === "webcore") {
    output = {
      width: clamp(Math.round(design.canvasWidth), MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH),
      height: clamp(Math.round(design.canvasHeight), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
      label: "웹코어 자유 캔버스",
      fixed: false,
    };
  } else {
    output = {
      width: clamp(Math.round(design.canvasWidth), MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH),
      height: clamp(Math.round(design.canvasHeight), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
      label: "사용자 캔버스",
      fixed: false,
    };
  }
  return layout.rotateOutput
    ? { ...output, width: output.height, height: output.width, label: `${output.label} · 방향 전환` }
    : output;
}

function getManuscriptShape(design: DesignSettings) {
  return { columns: clamp(Math.round(design.manuscriptColumns), 4, 60), rows: clamp(Math.round(design.manuscriptRows), 2, 40) };
}

function formatMessageTime(value: string) {
  if (!value) return "";
  const [hourText, minute = "00"] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;
  return `${period} ${displayHour}:${minute}`;
}

function defaultScrapbookParagraph(page: PageItem, index: number, count: number, frameStyle: ScrapbookFrameStyle = "paper"): ScrapbookElement {
  const twoColumns = count > 4;
  return {
    id: `${page.id}-paragraph-${index}`,
    kind: "paragraph",
    paragraphIndex: index,
    x: twoColumns ? 7 + (index % 2) * 47 : 10 + (index % 2) * 3,
    y: twoColumns ? 8 + Math.floor(index / 2) * 25 : 9 + index * 21,
    width: twoColumns ? 40 : 78,
    rotation: index % 2 === 0 ? -0.8 : 0.7,
    z: index + 1,
    frameStyle,
  };
}

function resolveScrapbookElements(page: PageItem, pageState?: ScrapbookPageState, defaultParagraphFrame: ScrapbookFrameStyle = "paper") {
  const paragraphs = page.text.split(/\n{2,}/).filter(Boolean);
  const savedParagraphs = new Map((pageState?.elements || []).filter((element) => element.kind === "paragraph").map((element) => [element.paragraphIndex, element]));
  const paragraphElements = paragraphs.map((_paragraph, index) => savedParagraphs.get(index) ?? defaultScrapbookParagraph(page, index, paragraphs.length, defaultParagraphFrame));
  const decorations = (pageState?.elements || []).filter((element) => element.kind !== "paragraph");
  return [...paragraphElements, ...decorations];
}

function scrapbookStateKey(pageId: string, mode: LayoutMode) {
  if (mode === "scrapbook") return `scrapbook:${pageId}`;
  if (mode === "manuscript") return `manuscript-free:${pageId}`;
  return `free-media:${mode}:${pageId}`;
}

function getScrapbookPageState(states: Record<string, ScrapbookPageState>, page: PageItem, mode: LayoutMode) {
  const namespaced = states[scrapbookStateKey(page.id, mode)];
  // Version 2 initially stored diary state under a bare page id. Keep reading that
  // shape for diary projects, but never expose it to the free-form manuscript.
  return namespaced ?? (mode === "scrapbook" ? states[page.id] : undefined);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function countRuleConflicts(text: string, rules: SyntaxRule[]) {
  const ranges: Array<{ start: number; end: number; id: string }> = [];
  rules.forEach((rule) => {
    if (!rule.start || !rule.end) return;
    let cursor = 0;
    while (cursor < text.length) {
      const start = text.indexOf(rule.start, cursor);
      if (start < 0) break;
      const endMarker = text.indexOf(rule.end, start + rule.start.length);
      if (endMarker < 0) break;
      const end = endMarker + rule.end.length;
      ranges.push({ start, end, id: rule.id });
      cursor = Math.max(end, start + 1);
    }
  });
  let conflicts = 0;
  for (let left = 0; left < ranges.length; left += 1) {
    for (let right = left + 1; right < ranges.length; right += 1) {
      if (ranges[left].id !== ranges[right].id && ranges[left].start < ranges[right].end && ranges[right].start < ranges[left].end) conflicts += 1;
    }
  }
  return conflicts;
}

function backgroundStyle(design: DesignSettings): CSSProperties {
  if (design.backgroundMode === "gradient") return { background: `linear-gradient(${design.gradientDirection}deg, ${design.gradientStart} 0%, ${design.gradientMiddle} 50%, ${design.gradientEnd} 100%)` };
  if (design.backgroundMode === "image") return { backgroundColor: design.solidColor };
  if (design.backgroundMode === "dot") return {
    backgroundColor: design.patternBaseColor,
    backgroundImage: `radial-gradient(circle, ${colorWithOpacity(design.patternColor, design.patternStrength / 100)} 0 ${design.dotSize}px, transparent ${design.dotSize + .2}px)`,
    backgroundSize: `${design.patternSize}px ${design.patternSize}px`,
    backgroundPosition: "center center",
  };
  if (design.backgroundMode === "check") return {
    backgroundColor: design.patternBaseColor,
    backgroundImage: `linear-gradient(90deg, transparent 50%, ${colorWithOpacity(design.patternColor, design.patternStrength / 100)} 50%), linear-gradient(transparent 50%, ${colorWithOpacity(design.patternColor, design.patternStrength / 100)} 50%)`,
    backgroundSize: `${design.patternSize * 2}px ${design.patternSize * 2}px`,
    backgroundPosition: "center center",
    backgroundBlendMode: "multiply",
  };
  if (design.backgroundMode === "radial") return {
    backgroundColor: design.radialBaseColor,
  };
  return { background: design.solidColor };
}

function colorWithOpacity(hex: string, opacity: number) {
  const normalized = hex.replace("#", "").trim();
  const expanded = normalized.length === 3 ? normalized.split("").map((value) => value + value).join("") : normalized;
  const numeric = Number.parseInt(expanded, 16);
  if (!Number.isFinite(numeric) || expanded.length !== 6) return `rgba(255,255,255,${opacity})`;
  return `rgba(${(numeric >> 16) & 255},${(numeric >> 8) & 255},${numeric & 255},${opacity})`;
}

function koreanEnding(term: string) {
  const lastCharacter = Array.from(term.trim()).reverse().find((character) => /[가-힣]/.test(character));
  if (!lastCharacter) return null;
  const syllableIndex = lastCharacter.charCodeAt(0) - 0xac00;
  if (syllableIndex < 0 || syllableIndex > 11171) return null;
  const batchim = syllableIndex % 28;
  return { hasBatchim: batchim !== 0, rieulBatchim: batchim === 8 };
}

function replaceWithKoreanParticles(text: string, from: string, to: string) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ending = koreanEnding(to);
  if (!ending) return text.split(from).join(to);
  const matcher = new RegExp(`${escaped}(이가|이는|이를|이와|이랑|이나|이야|은|는|이|가|을|를|과|와|랑|나|으로|로|아|야)?`, "g");
  return text.replace(matcher, (_match, particle = "") => {
    if (!particle) return to;
    const { hasBatchim, rieulBatchim } = ending;
    const corrected = particle === "은" || particle === "는" || particle === "이는"
      ? (hasBatchim ? "은" : "는")
      : ["이", "가", "이가"].includes(particle)
        ? (hasBatchim ? "이" : "가")
        : ["을", "를", "이를"].includes(particle)
          ? (hasBatchim ? "을" : "를")
          : ["과", "와", "이와"].includes(particle)
            ? (hasBatchim ? "과" : "와")
            : ["이랑", "랑"].includes(particle)
              ? (hasBatchim ? "이랑" : "랑")
              : ["이나", "나"].includes(particle)
                ? (hasBatchim ? "이나" : "나")
                : particle === "으로" || particle === "로"
                  ? (hasBatchim && !rieulBatchim ? "으로" : "로")
                  : (hasBatchim ? "아" : "야");
    return `${to}${corrected}`;
  });
}

function replaceSelectedOccurrences(text: string, from: string, to: string, excludedStarts: number[], autoFixParticles: boolean) {
  const matches = findTextMatches(text, from);
  const excluded = new Set(excludedStarts);
  const particlePattern = /^(이가|이는|이를|이와|이랑|이나|이야|으로|은|는|이|가|을|를|과|와|랑|나|로|아|야)/;
  let output = text;
  let count = 0;
  for (const start of [...matches].reverse()) {
    if (excluded.has(start)) continue;
    const actual = text.slice(start, start + from.length);
    let end = start + from.length;
    let replacement = to;
    if (autoFixParticles && to) {
      const particle = text.slice(end).match(particlePattern)?.[0] || "";
      if (particle) {
        replacement = replaceWithKoreanParticles(`${actual}${particle}`, actual, to);
        end += particle.length;
      }
    }
    output = `${output.slice(0, start)}${replacement}${output.slice(end)}`;
    count += 1;
  }
  return { text: output, count };
}

function MessagePreview({ page, rules, mosaicTerms, layout, directMarks = [], flowBlocks = [] }: { page: PageItem; rules: SyntaxRule[]; mosaicTerms: string[]; layout: LayoutSettings; directMarks?: DirectTextMark[]; flowBlocks?: FlowBlock[] }) {
  const paragraphs = splitParagraphsWithOffsets(page.text);
  const pageBlocks = flowBlocks.filter((block) => block.anchor >= page.startOffset && block.anchor <= page.startOffset + page.text.length).sort((a, b) => a.anchor - b.anchor);
  const renderedBlocks = new Set<string>();
  const threadStyle = { "--message-gap": `${layout.messageGap}px`, "--bubble-max": `${layout.bubbleMaxWidth}%`, "--bubble-radius": `${layout.bubbleRadius}px`, "--bubble-pad-x": `${layout.bubblePaddingX}px`, "--bubble-pad-y": `${layout.bubblePaddingY}px` } as CSSProperties;
  const renderPhotoMessage = (block: FlowBlock) => {
    const speaker = layout.speakers.find((item) => item.id === block.messageSpeakerId) || layout.speakers[0];
    if (!speaker || !block.src) return renderFlowBlock(block);
    const metaNode = ((layout.showTime && block.time) || (layout.showReadStatus && block.readStatus)) ? <small className="message-meta">{layout.showReadStatus && block.readStatus && <span>{block.readStatus}</span>}{layout.showTime && block.time && <span>{formatMessageTime(block.time)}</span>}</small> : null;
    const fixedBubbleColor = layout.mode === "messenger" && layout.messengerStyle === "kakao" ? (speaker.side === "right" ? "#fee500" : "#ffffff") : layout.mode === "messenger" && layout.messengerStyle === "dm" ? (speaker.side === "right" ? "#a855d4" : layout.dmTheme === "dark" ? "#26262b" : "#ffffff") : speaker.color;
    return <div className={`message-row side-${speaker.side} is-photo-only`} key={block.id}>
      {layout.showAvatars && speaker.side === "left" && <div className="message-avatar">{speaker.avatar ? <img src={speaker.avatar} alt="" /> : speaker.name.slice(0, 1)}</div>}
      <div className="message-stack">
        {layout.showSpeakerNames && (speaker.side === "left" || layout.mode === "bubble") && <span className="message-speaker">{speaker.name}</span>}
        <div className="message-line">{speaker.side === "right" && metaNode}<div className={`message-bubble photo-only-bubble ${layout.showTails ? "with-tail" : ""}`} style={{ "--bubble-color": fixedBubbleColor } as CSSProperties}><figure className="flow-image placement-flow"><img src={block.src} alt="사진 메시지" draggable={false} /></figure></div>{speaker.side === "left" && metaNode}</div>
      </div>
      {layout.showAvatars && speaker.side === "right" && <div className="message-avatar">{speaker.avatar ? <img src={speaker.avatar} alt="" /> : speaker.name.slice(0, 1)}</div>}
    </div>;
  };
  const nodes = paragraphs.flatMap((paragraph, index) => {
    const dueBlocks = pageBlocks.filter((block) => !renderedBlocks.has(block.id) && block.anchor <= page.startOffset + paragraph.start);
    dueBlocks.forEach((block) => renderedBlocks.add(block.id));
    const assignmentKey = `${page.id}:${index}`;
    const globalAssignmentKey = `text:${page.startOffset + paragraph.start}`;
    const speaker = layout.speakers.find((item) => item.id === (layout.assignments[globalAssignmentKey] || layout.assignments[assignmentKey]));
    const photoMessages = dueBlocks.filter((block) => block.type === "image" && block.photoOnly).map(renderPhotoMessage);
    const attachedImages = speaker ? dueBlocks.filter((block) => block.type === "image" && !block.photoOnly) : [];
    const before = dueBlocks.filter((block) => !block.photoOnly && (!speaker || block.type !== "image")).map(renderFlowBlock);
    if (!speaker) return [...photoMessages, ...before, <div className="message-narration" key={assignmentKey}>{renderInline(paragraph.text, rules, mosaicTerms, assignmentKey, directMarks, page.startOffset + paragraph.start, layout)}</div>];
    const previousParagraph = paragraphs[index - 1];
    const previousGlobalKey = previousParagraph ? `text:${page.startOffset + previousParagraph.start}` : "";
    const previous = index > 0 ? layout.speakers.find((item) => item.id === (layout.assignments[previousGlobalKey] || layout.assignments[`${page.id}:${index - 1}`])) : null;
    const hideAvatar = layout.compactAvatars && previous?.id === speaker.id;
    const meta = layout.messageMeta[assignmentKey] || { time: "", readStatus: "" };
    const metaNode = ((layout.showTime && meta.time) || (layout.showReadStatus && meta.readStatus)) ? <small className="message-meta">{layout.showReadStatus && meta.readStatus && <span>{meta.readStatus}</span>}{layout.showTime && meta.time && <span>{formatMessageTime(meta.time)}</span>}</small> : null;
    const fixedBubbleColor = layout.mode === "messenger" && layout.messengerStyle === "kakao" ? (speaker.side === "right" ? "#fee500" : "#ffffff") : layout.mode === "messenger" && layout.messengerStyle === "dm" ? (speaker.side === "right" ? "#a855d4" : layout.dmTheme === "dark" ? "#26262b" : "#ffffff") : speaker.color;
    const fixedTextColor = layout.mode === "messenger" && layout.messengerStyle === "kakao"
      ? "#171719"
      : layout.mode === "messenger" && layout.messengerStyle === "dm"
        ? (speaker.side === "right" ? "#ffffff" : layout.dmTheme === "dark" ? "#f4f4f6" : "#171719")
        : "var(--preview-text)";
    return [...photoMessages, ...before, <div className={`message-row side-${speaker.side}`} key={assignmentKey}>
      {layout.showAvatars && speaker.side === "left" && <div className={`message-avatar ${hideAvatar ? "is-placeholder" : ""}`}>{!hideAvatar && (speaker.avatar ? <img src={speaker.avatar} alt="" /> : speaker.name.slice(0, 1))}</div>}
      <div className="message-stack">
        {layout.showSpeakerNames && !hideAvatar && (speaker.side === "left" || layout.mode === "bubble") && <span className="message-speaker">{speaker.name}</span>}
        <div className="message-line">{speaker.side === "right" && metaNode}<div className={`message-bubble ${layout.showTails ? "with-tail" : ""}`} style={{ "--bubble-color": fixedBubbleColor, color: fixedTextColor } as CSSProperties}>{attachedImages.map(renderFlowBlock)}{renderInline(paragraph.text, rules, mosaicTerms, assignmentKey, directMarks, page.startOffset + paragraph.start, layout)}</div>{speaker.side === "left" && metaNode}</div>
      </div>
      {layout.showAvatars && speaker.side === "right" && <div className={`message-avatar ${hideAvatar ? "is-placeholder" : ""}`}>{!hideAvatar && (speaker.avatar ? <img src={speaker.avatar} alt="" /> : speaker.name.slice(0, 1))}</div>}
    </div>];
  });
  pageBlocks.filter((block) => !renderedBlocks.has(block.id)).forEach((block) => nodes.push(block.type === "image" && block.photoOnly ? renderPhotoMessage(block) : renderFlowBlock(block)));
  return <div className="message-thread" style={threadStyle}>{nodes}</div>;
}

function MessengerPreview({ page, rules, mosaicTerms, layout, directMarks, flowBlocks }: { page: PageItem; rules: SyntaxRule[]; mosaicTerms: string[]; layout: LayoutSettings; directMarks: DirectTextMark[]; flowBlocks: FlowBlock[] }) {
  const isDm = layout.messengerStyle === "dm";
  const title = layout.chatTitle.trim() || layout.speakers.map((speaker) => speaker.name).filter(Boolean).join(", ") || "대화";
  const leadSpeaker = layout.speakers[0];
  return <div className={`messenger-shell ${isDm ? `is-dm theme-${layout.dmTheme}` : "is-kakao"}`}>
    <div className="messenger-status-bar"><b>{(layout.statusBarTime || "09:41").replace(/^0/, "")}</b><span aria-hidden="true">●●● ᯤ ▰</span></div>
    <div className="messenger-app-bar">
      <span className="messenger-back" aria-hidden="true">‹</span>
      {isDm && <div className="messenger-title-avatar">{leadSpeaker?.avatar ? <img src={leadSpeaker.avatar} alt="" /> : leadSpeaker?.name.slice(0, 1) || "Q"}</div>}
      <div className="messenger-title"><b>{title}</b>{layout.chatSubtitle && <small>{layout.chatSubtitle}</small>}</div>
      <div className="messenger-actions" aria-hidden="true">{isDm ? <><span>⌕</span><span>ⓘ</span></> : <><span>⌕</span><span>☰</span></>}</div>
    </div>
    <div className="messenger-chat-area">
      {layout.chatDate && <div className="message-date-divider">{layout.chatDate}</div>}
      <MessagePreview page={page} rules={rules} mosaicTerms={mosaicTerms} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} />
    </div>
    <div className="messenger-composer" aria-hidden="true"><span>＋</span><i>{layout.chatComposerText || "메시지 보내기"}</i><b className="messenger-send"><svg viewBox="0 0 24 24"><path d="M3.4 3.2 21 12 3.4 20.8l2.2-7.1L14 12l-8.4-1.7-2.2-7.1Z" /></svg></b></div>
  </div>;
}

function ScrapbookPreview({ page, pageState, rules, mosaicTerms, directMarks = [], layout, selectedId, editable = false, onSelect, onChange }: {
  page: PageItem;
  pageState?: ScrapbookPageState;
  rules: SyntaxRule[];
  mosaicTerms: string[];
  directMarks?: DirectTextMark[];
  layout?: LayoutSettings;
  selectedId?: string | null;
  editable?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (id: string, patch: Partial<ScrapbookElement>) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number; clientX: number; clientY: number; x: number; y: number; width: number } | null>(null);
  const paragraphs = splitParagraphsWithOffsets(page.text);
  const diaryMode = layout?.mode === "scrapbook";
  const elements = diaryMode ? resolveScrapbookElements(page, pageState, "paper") : (pageState?.elements || []).filter((element) => element.kind !== "paragraph");

  function startDrag(event: ReactPointerEvent<HTMLDivElement>, element: ScrapbookElement) {
    if (!editable || !onChange) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { id: element.id, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: element.x, y: element.y, width: element.width };
    onSelect?.(element.id);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const box = canvasRef.current?.getBoundingClientRect();
    if (!drag || drag.pointerId !== event.pointerId || !box || !onChange) return;
    const rawX = clamp(drag.x + ((event.clientX - drag.clientX) / box.width) * 100, 0, 100 - drag.width);
    const rawY = clamp(drag.y + ((event.clientY - drag.clientY) / box.height) * 100, 0, 94);
    const snap = layout?.mode === "manuscript" ? 2 : layout?.scrapbookSnap ? 2 : 1;
    const x = snap ? Math.round(rawX / snap) * snap : rawX;
    const y = snap ? Math.round(rawY / snap) * snap : rawY;
    onChange(drag.id, { x, y });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  return <div ref={canvasRef} className={`scrapbook-canvas ${diaryMode ? "is-diary-canvas" : "is-free-media-canvas"} ${editable ? "is-editable" : ""} ${diaryMode && layout?.scrapbookShowGuides ? "show-guides" : ""}`}>
    {diaryMode && <><div className="scrapbook-tape tape-one" aria-hidden="true" /><div className="scrapbook-tape tape-two" aria-hidden="true" /></>}
    {diaryMode && layout?.scrapbookShowGuides && <><div className="scrapbook-guide is-horizontal" aria-hidden="true" /><div className="scrapbook-guide is-vertical" aria-hidden="true" /></>}
    {elements.map((element) => {
      const style = { left: `${element.x}%`, top: `${element.y}%`, width: `${element.width}%`, transform: `rotate(${element.rotation}deg)`, zIndex: element.z } as CSSProperties;
      const selected = selectedId === element.id;
      return <div
        className={`scrapbook-element kind-${element.kind} frame-${element.frameStyle || (element.kind === "image" ? "polaroid" : element.kind === "paragraph" ? (layout?.mode === "manuscript" ? "none" : "paper") : "none")} ${selected ? "is-selected" : ""}`}
        style={style}
        role={editable ? "button" : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={editable ? `${element.kind === "paragraph" ? `문단 ${(element.paragraphIndex ?? 0) + 1}` : element.kind === "image" ? "사진" : "스티커"} 이동` : undefined}
        onPointerDown={(event) => startDrag(event, element)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => onSelect?.(element.id)}
        onFocus={() => onSelect?.(element.id)}
        key={element.id}
      >
        {element.kind === "paragraph" && <div className="scrapbook-paragraph">{renderInline(paragraphs[element.paragraphIndex ?? 0]?.text || "", rules, mosaicTerms, `scrapbook-${page.id}-${element.paragraphIndex}`, directMarks, page.startOffset + (paragraphs[element.paragraphIndex ?? 0]?.start || 0), layout)}</div>}
        {element.kind === "image" && element.src && <div className="scrapbook-photo"><img src={element.src} alt="사용자가 추가한 사진" draggable={false} /></div>}
        {element.kind === "sticker" && element.src && <div className="scrapbook-sticker"><img src={element.src} alt="사용자가 추가한 스티커 이미지" draggable={false} /></div>}
        {editable && selected && <span className="scrapbook-drag-label">사진 이동</span>}
      </div>;
    })}
  </div>;
}

function formatPageNumberPattern(pattern: string, pageNumber: number, totalPages: number) {
  return pattern
    .replaceAll("{current:02}", String(pageNumber).padStart(2, "0"))
    .replaceAll("{total:02}", String(totalPages).padStart(2, "0"))
    .replaceAll("{current}", String(pageNumber))
    .replaceAll("{total}", String(totalPages));
}

const pageNumberPatternPresets = [
  { id: "current", label: "현재 번호", pattern: "{current}" },
  { id: "current-total", label: "현재 / 전체", pattern: "{current} / {total}" },
  { id: "two-digits", label: "두 자리", pattern: "{current:02} / {total:02}" },
  { id: "chapter", label: "장 단위", pattern: "{current}장" },
] as const;

function PreviewPage({ page, pageNumber, totalPages, title, rules, mosaicTerms, directMarks, flowBlocks, paragraphMarks, design, layout, scrapbookPage, scrapbookSelectedId, onScrapbookSelect, onScrapbookChange, fixedSize = false }: {
  page: PageItem;
  pageNumber: number;
  totalPages: number;
  title: string;
  rules: SyntaxRule[];
  mosaicTerms: string[];
  directMarks: DirectTextMark[];
  flowBlocks: FlowBlock[];
  paragraphMarks: ParagraphMark[];
  design: DesignSettings;
  layout: LayoutSettings;
  scrapbookPage?: ScrapbookPageState;
  scrapbookSelectedId?: string | null;
  onScrapbookSelect?: (id: string) => void;
  onScrapbookChange?: (id: string, patch: Partial<ScrapbookElement>) => void;
  fixedSize?: boolean;
}) {
  const font = fontOptions.find((option) => option.id === design.fontId) ?? fontOptions[0];
  const outputSize = getOutputSize(design, layout);
  const manuscriptShape = getManuscriptShape(design);
  const effectiveBackgroundMode = design.backgroundMode;
  const style = {
    ...backgroundStyle(design),
    aspectRatio: `${outputSize.width} / ${outputSize.height}`,
    ...(fixedSize ? { width: `${outputSize.width}px`, height: `${outputSize.height}px` } : {}),
    "--preview-font": font.family,
    "--preview-text": design.textColor,
    "--text-size": `${design.fontSize}px`,
    "--text-weight": design.fontWeight,
    "--text-line": `${design.fontSize * design.lineHeight}px`,
    "--letter-spacing": `${design.letterSpacing}em`,
    "--paragraph-spacing": `${design.paragraphSpacing}em`,
    "--text-scale-x": design.textScaleX / 100,
    "--text-scale-compensation": `${10000 / design.textScaleX}%`,
    "--text-shadow": design.textShadowEnabled ? `0 1px ${design.textShadowBlur}px ${design.textShadowColor}` : "none",
    "--column-gap": `${design.columnGap}px`,
    "--text-columns": design.textColumns,
    "--word-break": design.wrapMode,
    "--padding-top": `${design.paddingTop}px`,
    "--padding-right": `${design.paddingRight}px`,
    "--padding-bottom": `${design.paddingBottom}px`,
    "--padding-left": `${design.paddingLeft}px`,
    "--attribution-x": `${layout.attributionX}%`,
    "--attribution-y": `${layout.attributionY}%`,
    "--attribution-shift-x": `${-layout.attributionX}%`,
    "--attribution-shift-y": `${-layout.attributionY}%`,
    "--attribution-gap": `${layout.attributionGap}px`,
    "--attribution-platform-offset-y": `${layout.attributionPlatformOffsetY}px`,
    "--manuscript-paper-color": design.paperColor,
    "--manuscript-character-offset": `${getManuscriptFontOffset(font.id)}em`,
  } as CSSProperties;
  const overlayStyle = {
    backgroundColor: effectiveBackgroundMode === "image" ? colorWithOpacity(design.overlayColor, design.overlayOpacity / 100) : "transparent",
    color: design.textColor,
    textAlign: design.textAlign,
  } as CSSProperties;
  const phoneMessenger = layout.mode === "messenger";
  const bookMode = layout.mode === "classic" && layout.bookFeaturesEnabled;
  const showAttribution = layout.attributionVisible && Boolean(layout.attributionCharacter || layout.attributionCreator || layout.attributionPlatform);
  const hasFooterPageNumber = !["manuscript", "document"].includes(layout.mode) && (design.showPageNumber || bookMode);
  const layoutClass = phoneMessenger ? `layout-messenger layout-${layout.messengerStyle}` : `layout-${layout.mode}`;
  const pageTitle = layout.pageTitleOverrides[page.id] || layout.pageTitle || title || "제목 없는 발췌";
  const pageNumberLabel = layout.pageNumberOverrides[page.id] || formatPageNumberPattern(layout.pageNumberPattern, pageNumber, totalPages);

  return <div className={`preview-canvas background-${effectiveBackgroundMode} ${layoutClass} mosaic-${design.mosaicMode} ${layout.mode === "notebook" ? `pattern-${layout.notebookPattern}` : ""} ${bookMode ? "layout-booklet" : ""} ${showAttribution ? "has-attribution" : ""} ${showAttribution && hasFooterPageNumber ? "has-page-number" : ""} ${fixedSize ? "is-export-page" : ""} page-${pageNumber % 2 ? "odd" : "even"}`} style={style}>
    {effectiveBackgroundMode === "image" && design.imageBackground && <div className="preview-background-layer" style={{ backgroundImage: `url(${design.imageBackground})`, backgroundSize: design.imageFit === "stretch" ? "100% 100%" : design.imageFit, backgroundPosition: `${design.imagePositionX}% ${design.imagePositionY}%`, transform: `scale(${design.imageScale / 100})`, filter: `blur(${design.imageBlur}px)` }} />}
    {effectiveBackgroundMode === "radial" && design.radialGlows.map((glow) => <div className={`preview-glow-item glow-${glow.shape}`} style={{ left: `${glow.x}%`, top: `${glow.y}%`, width: `${glow.size}%`, color: glow.color, "--glow-blur": `${glow.blur}px`, "--glow-color-76": colorWithOpacity(glow.color, .76), "--glow-color-32": colorWithOpacity(glow.color, .32), "--glow-color-0": colorWithOpacity(glow.color, 0) } as CSSProperties} aria-hidden="true" key={glow.id}>{glow.shape === "circle" ? <i /> : <GlowShapeSvg type={glow.shape} />}</div>)}
    <div className={`preview-overlay align-${design.verticalAlign}`} style={overlayStyle}>
      {layout.mode === "scrapbook" ? <><ScrapbookPreview page={page} pageState={scrapbookPage} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} layout={layout} selectedId={scrapbookSelectedId} editable={Boolean(onScrapbookChange)} onSelect={onScrapbookSelect} onChange={onScrapbookChange} />{design.showPageNumber && <div className="preview-page-number scrapbook-page-number">{pageNumberLabel}</div>}</> : page.cover ? <div className="book-cover"><span>{layout.bookSubtitle || "QUOTE COLLECTION"}</span><h2>{layout.bookTitle || pageTitle}</h2><i />{layout.bookAuthor && <b>{layout.bookAuthor}</b>}</div> : <>
        {bookMode && <div className="book-running-header"><span>{layout.pageTitleOverrides[page.id] || layout.runningHeader || pageTitle}</span><i>{pageNumberLabel}</i></div>}
        {design.showHeader && ["classic", "bubble"].includes(layout.mode) && <div className="preview-heading">{layout.headerKicker && <span>{layout.headerKicker}</span>}<b>{pageTitle}</b></div>}
        <div className="preview-body">
          {bookMode && layout.chapterTitle && <div className="book-chapter"><small>CHAPTER</small><h3>{layout.chapterTitle}</h3></div>}
          {layout.mode === "manuscript" ? <ManuscriptPreview page={page} rules={rules} mosaicTerms={mosaicTerms} columns={manuscriptShape.columns} rows={manuscriptShape.rows} title={title} pageNumber={pageNumber} surface={design.surfaceSize} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} /> : layout.mode === "notebook" ? <NotebookPreview page={page} pageNumber={pageNumber} rules={rules} mosaicTerms={mosaicTerms} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} /> : layout.mode === "microfilm" ? <MicrofilmPreview page={page} pageNumber={pageNumber} rules={rules} mosaicTerms={mosaicTerms} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} /> : layout.mode === "document" ? <DocumentPreview page={page} pageNumber={pageNumber} totalPages={totalPages} title={title} rules={rules} mosaicTerms={mosaicTerms} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} /> : layout.mode === "webcore" ? <WebcorePreview page={page} rules={rules} mosaicTerms={mosaicTerms} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} /> : phoneMessenger ? <MessengerPreview page={page} rules={rules} mosaicTerms={mosaicTerms} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} /> : layout.mode === "bubble" ? <MessagePreview page={page} rules={rules} mosaicTerms={mosaicTerms} layout={layout} directMarks={directMarks} flowBlocks={flowBlocks} /> : <PreviewText text={page.text} rules={rules} mosaicTerms={mosaicTerms} paragraphIndent={bookMode && layout.paragraphIndent} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} baseOffset={page.startOffset} layout={layout} />}
        </div>
        {!phoneMessenger && scrapbookPage && scrapbookPage.elements.some((element) => element.kind === "image") && <ScrapbookPreview page={page} pageState={scrapbookPage} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} layout={layout} selectedId={scrapbookSelectedId} editable={Boolean(onScrapbookChange)} onSelect={onScrapbookSelect} onChange={onScrapbookChange} />}
        {hasFooterPageNumber && <div className="preview-page-number">{pageNumberLabel}</div>}
      </>}
      {showAttribution && <div className="excerpt-attribution"><div className="excerpt-byline">{layout.attributionCharacter && <span>{layout.attributionCharacter}</span>}{layout.attributionCharacter && layout.attributionCreator && <i aria-hidden="true" />}{layout.attributionCreator && <span>{layout.attributionCreator}</span>}</div>{layout.attributionPlatform && <strong>{layout.attributionPlatform}</strong>}</div>}
    </div>
  </div>;
}

function HighlightedEditorText({ text, term, excludedStarts = [] }: { text: string; term: string; excludedStarts?: number[] }) {
  if (!term) return <>{text}</>;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  const excluded = new Set(excludedStarts);
  const matches = findTextMatches(text, term);
  for (const match of matches) {
    if (match > cursor) nodes.push(text.slice(cursor, match));
    nodes.push(excluded.has(match) ? text.slice(match, match + term.length) : <mark key={`${match}-${term}`}>{text.slice(match, match + term.length)}</mark>);
    cursor = match + term.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

export default function QuoteStudio() {
  const [projectId, setProjectId] = useState(starterProject.id);
  const [projectTitle, setProjectTitle] = useState(starterProject.title);
  const [source, setSource] = useState(starterProject.source);
  const [draft, setDraft] = useState(starterProject.draft);
  const [rules, setRules] = useState<SyntaxRule[]>([]);
  const [mosaicTerms, setMosaicTerms] = useState<string[]>([]);
  const [design, setDesign] = useState<DesignSettings>(starterProject.design);
  const [layout, setLayout] = useState<LayoutSettings>(starterProject.layout);
  const [scrapbookPages, setScrapbookPages] = useState<Record<string, ScrapbookPageState>>(starterProject.scrapbookPages || {});
  const [directMarks, setDirectMarks] = useState<DirectTextMark[]>(starterProject.directMarks || []);
  const [flowBlocks, setFlowBlocks] = useState<FlowBlock[]>(normalizeFlowBlocks(starterProject.flowBlocks));
  const [paragraphMarks, setParagraphMarks] = useState<ParagraphMark[]>(normalizeParagraphMarks(starterProject.paragraphMarks));
  const [selectedParagraphStarts, setSelectedParagraphStarts] = useState<number[]>([]);
  const [projects, setProjects] = useState<ProjectSnapshot[]>([starterProject]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [lastSavedFingerprint, setLastSavedFingerprint] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId>("import");
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_LEFT_PANEL_WIDTH);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [sourceView, setSourceView] = useState<"raw" | "text">("raw");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("draft");
  const [canvasZoom, setCanvasZoom] = useState(72);
  const [canvasFitMode, setCanvasFitMode] = useState<CanvasFitMode>("all");
  const [canvasWidthInput, setCanvasWidthInput] = useState(String(starterProject.design.canvasWidth));
  const [canvasHeightInput, setCanvasHeightInput] = useState(String(starterProject.design.canvasHeight));
  const [canvasOverflow, setCanvasOverflow] = useState(false);
  const [historyAvailability, setHistoryAvailability] = useState({ undo: false, redo: false });
  const accent = UI_ACCENT;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<Omit<SyntaxRule, "id">>({ ...emptyRuleDraft });
  const [ruleEditorAnchor, setRuleEditorAnchor] = useState<string | "manual" | null>(null);
  const [directStyleDraft, setDirectStyleDraft] = useState<DirectTextStyle>({ ...emptyDirectStyle });
  const [paragraphStyleDraft, setParagraphStyleDraft] = useState({
    color: "#2d2b2a",
    bold: false,
    italic: false,
    presentationColor: "#6694ea",
    linePurpose: "emphasis" as LinePurpose,
    lineStyle: "vertical-solid" as ParagraphLineStyle,
    linePosition: "below" as "above" | "below",
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [mosaicInput, setMosaicInput] = useState("");
  const [wordSearch, setWordSearch] = useState("");
  const [wordMatchIndex, setWordMatchIndex] = useState(0);
  const [searchExcludedStarts, setSearchExcludedStarts] = useState<number[]>([]);
  const [replaceTo, setReplaceTo] = useState("");
  const [autoFixParticles, setAutoFixParticles] = useState(true);
  const [editorSelection, setEditorSelection] = useState({ start: 0, end: 0 });
  const [replacementHistory, setReplacementHistory] = useState<ReplacementRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [designName, setDesignName] = useState("");
  const [avatarTarget, setAvatarTarget] = useState<string | null>(null);
  const [selectedScrapbookElementId, setSelectedScrapbookElementId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const scrapbookImageInputRef = useRef<HTMLInputElement>(null);
  const messagePhotoInputRef = useRef<HTMLInputElement>(null);
  const [messagePhotoSpeakerId, setMessagePhotoSpeakerId] = useState(defaultSpeakers[0].id);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const editorHighlightRef = useRef<HTMLDivElement>(null);
  const toolPanelRef = useRef<HTMLElement | null>(null);
  const pendingRuleScrollAnchorRef = useRef<string | null>(null);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const longExportRef = useRef<HTMLDivElement>(null);
  const canvasWorkbenchRef = useRef<HTMLDivElement>(null);
  const fontCssCacheRef = useRef<Partial<Record<FontId, string>>>({});
  const historyPastRef = useRef<string[]>([]);
  const historyFutureRef = useRef<string[]>([]);
  const historyCurrentRef = useRef("");
  const historyProjectRef = useRef("");
  const historyTimerRef = useRef<number | null>(null);
  const historyRestoringRef = useRef(false);
  const leftPanelResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const activeToolIndex = Math.max(0, toolItems.findIndex((tool) => tool.tools.includes(activeTool)));
  const activeToolItem = toolItems[activeToolIndex];
  const candidates = useMemo(() => detectCandidates(source), [source]);
  const assignedSignatures = useMemo(() => new Set(rules.map((rule) => `${rule.start}::${rule.end}`)), [rules]);
  const dialogueParagraphs = useMemo(() => splitParagraphsWithOffsets(draft).filter((paragraph) => parseSegments(paragraph.text, rules).some((segment) => segment.rule?.role === "dialogue")), [draft, rules]);
  const paragraphReview = useMemo(() => splitParagraphsWithOffsets(draft).map((paragraph) => {
    const mark = paragraphMarks.find((item) => item.start === paragraph.start);
    const detectedRule = parseSegments(paragraph.text, rules).find((segment) => segment.rule && segment.rule.role !== "other")?.rule;
    const detectedRole: ParagraphRole = detectedRule?.role === "dialogue" ? "dialogue" : detectedRule?.role === "narration" ? "narration" : "other";
    return {
      ...paragraph,
      end: paragraph.start + paragraph.text.length,
      mark,
      detectedRole,
      resolvedRole: mark?.role || detectedRole,
      resolvedPresentation: mark?.presentation || (detectedRule?.role === "dialogue" && detectedRule.presentation !== "default" ? detectedRule.presentation : undefined),
      detectedRule,
    };
  }), [draft, paragraphMarks, rules]);
  const conflictCount = useMemo(() => countRuleConflicts(draft, rules), [draft, rules]);
  const htmlCount = useMemo(() => countMatches(source, /<\/?[a-z][^>]*>/gi), [source]);
  const selectedOutputSize = useMemo(() => getOutputSize(design, layout), [design, layout]);
  const estimatedPageCapacity = useMemo(() => estimateCanvasCapacity(design, layout), [design, layout]);
  const contentPages = useMemo(() => {
    const manuscript = layout.mode === "manuscript";
    const shape = getManuscriptShape(design);
    const automaticCapacity = layout.paginationBasis === "canvas" ? estimatedPageCapacity : layout.pageCapacity;
    return paginateText(draft, layout.autoPaginate || manuscript, manuscript ? shape.columns * shape.rows : automaticCapacity);
  }, [draft, design, estimatedPageCapacity, layout.autoPaginate, layout.mode, layout.pageCapacity, layout.paginationBasis]);
  const displayPages = useMemo<PageItem[]>(() => {
    if (layout.mode === "classic" && layout.bookFeaturesEnabled && layout.showCover) return [{ id: "book-cover", text: "", sourceIndex: -1, startOffset: 0, cover: true }, ...contentPages];
    return contentPages;
  }, [contentPages, layout.bookFeaturesEnabled, layout.mode, layout.showCover]);
  const visiblePage = displayPages[currentPage] ?? displayPages[0];
  const visibleParagraphs = useMemo(() => visiblePage && !visiblePage.cover ? splitParagraphsWithOffsets(visiblePage.text) : [], [visiblePage]);
  const visibleScrapbookState = useMemo(() => visiblePage ? getScrapbookPageState(scrapbookPages, visiblePage, layout.mode) : undefined, [visiblePage, scrapbookPages, layout.mode]);
  const visibleScrapbookElements = useMemo(() => {
    if (!visiblePage) return [];
    return layout.mode === "scrapbook"
      ? resolveScrapbookElements(visiblePage, visibleScrapbookState, "paper")
      : (visibleScrapbookState?.elements || []).filter((element) => element.kind !== "paragraph");
  }, [visiblePage, visibleScrapbookState, layout.mode]);
  const selectedScrapbookElement = visibleScrapbookElements.find((element) => element.id === selectedScrapbookElementId) ?? null;
  const charCount = draft.length;
  const registeredMosaicSearchTerm = useMemo(() => mosaicTerms.find((term) => term.toLocaleLowerCase() === wordSearch.trim().toLocaleLowerCase()) || "", [wordSearch, mosaicTerms]);
  const wordMatches = useMemo(() => findTextMatches(draft, wordSearch.trim()), [draft, wordSearch]);
  const currentWordDisplayIndex = wordMatches.length ? clamp(wordMatchIndex, 0, wordMatches.length - 1) : 0;
  const currentWordMatch = wordMatches.length ? wordMatches[currentWordDisplayIndex] : -1;
  const currentWordExcluded = currentWordMatch >= 0 && searchExcludedStarts.includes(currentWordMatch);
  const selectedWordMatchCount = Math.max(0, wordMatches.length - searchExcludedStarts.filter((start) => wordMatches.includes(start)).length);
  const rootStyle = { "--accent": accent, "--left-panel-width": `${leftPanelWidth}px` } as CSSProperties;

  const snapshotBase = useMemo<Omit<ProjectSnapshot, "updatedAt">>(() => ({ version: 2, id: projectId, title: projectTitle, source, draft, rules, mosaicTerms, design, layout, scrapbookPages, directMarks, flowBlocks, paragraphMarks }), [projectId, projectTitle, source, draft, rules, mosaicTerms, design, layout, scrapbookPages, directMarks, flowBlocks, paragraphMarks]);
  const fingerprint = useMemo(() => JSON.stringify(snapshotBase), [snapshotBase]);
  const dirty = storageReady && fingerprint !== lastSavedFingerprint;
  const canUndo = historyAvailability.undo;
  const canRedo = historyAvailability.redo;

  function refreshHistoryButtons() {
    setHistoryAvailability({ undo: historyPastRef.current.length > 0, redo: historyFutureRef.current.length > 0 });
  }

  function resetHistory() {
    if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = null;
    historyPastRef.current = [];
    historyFutureRef.current = [];
    historyCurrentRef.current = "";
    historyProjectRef.current = "";
    historyRestoringRef.current = false;
    refreshHistoryButtons();
  }

  function restoreHistory(serialized: string) {
    const restored = JSON.parse(serialized) as Omit<ProjectSnapshot, "updatedAt">;
    setProjectTitle(restored.title || "제목 없는 발췌");
    setSource(restored.source || "");
    setDraft(restored.draft || "");
    setRules(normalizeRules(restored.rules));
    setMosaicTerms(restored.mosaicTerms || []);
    setDesign(normalizeDesign(restored.design));
    setLayout(normalizeLayout(restored.layout, restored.design));
    setScrapbookPages(restored.scrapbookPages || {});
    setDirectMarks(normalizeDirectMarks(restored.directMarks));
    setFlowBlocks(normalizeFlowBlocks(restored.flowBlocks));
    setParagraphMarks(normalizeParagraphMarks(restored.paragraphMarks));
    setSelectedParagraphStarts([]);
    setCurrentPage(0);
    setSelectedScrapbookElementId(null);
  }

  function undoProject() {
    const previous = historyPastRef.current.pop();
    if (!previous) return;
    if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = null;
    historyFutureRef.current.push(historyCurrentRef.current || fingerprint);
    historyCurrentRef.current = previous;
    historyRestoringRef.current = true;
    restoreHistory(previous);
    refreshHistoryButtons();
    setToast("마지막 편집을 실행 취소했습니다.");
  }

  function redoProject() {
    const next = historyFutureRef.current.pop();
    if (!next) return;
    if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = null;
    historyPastRef.current.push(historyCurrentRef.current || fingerprint);
    historyCurrentRef.current = next;
    historyRestoringRef.current = true;
    restoreHistory(next);
    refreshHistoryButtons();
    setToast("편집을 다시 실행했습니다.");
  }

  function fitCanvas(mode: Exclude<CanvasFitMode, "custom">) {
    const workbench = canvasWorkbenchRef.current;
    if (!workbench) return;
    const spread = layout.mode === "classic" && layout.bookFeaturesEnabled && layout.bookView === "spread";
    const stageWidth = selectedOutputSize.width * (spread ? 2 : 1) + (spread ? 2 : 0);
    const stageHeight = selectedOutputSize.height;
    const availableWidth = Math.max(160, workbench.clientWidth - 76);
    const availableHeight = Math.max(160, workbench.clientHeight - 84);
    const widthScale = availableWidth / stageWidth;
    const heightScale = availableHeight / stageHeight;
    const scale = mode === "width" ? widthScale : mode === "height" ? heightScale : Math.min(widthScale, heightScale);
    setCanvasFitMode(mode);
    setCanvasZoom(clamp(Math.floor(scale * 100), 10, 200));
  }

  function setCustomZoom(next: number) {
    setCanvasFitMode("custom");
    setCanvasZoom(clamp(next, 10, 200));
  }

  function startLeftPanelResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.innerWidth <= 1180 || leftCollapsed) return;
    leftPanelResizeRef.current = { startX: event.clientX, startWidth: leftPanelWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveLeftPanelResize(event: ReactPointerEvent<HTMLDivElement>) {
    const resizing = leftPanelResizeRef.current;
    if (!resizing) return;
    const availableMaximum = Math.max(MIN_LEFT_PANEL_WIDTH, window.innerWidth - (rightCollapsed ? 600 : 920));
    setLeftPanelWidth(clamp(resizing.startWidth + event.clientX - resizing.startX, MIN_LEFT_PANEL_WIDTH, Math.min(MAX_LEFT_PANEL_WIDTH, availableMaximum)));
  }

  function endLeftPanelResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!leftPanelResizeRef.current) return;
    leftPanelResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function applyProject(project: ProjectSnapshot) {
    resetHistory();
    setProjectId(project.id);
    setProjectTitle(project.title || "제목 없는 발췌");
    setSource(project.source || "");
    setDraft(project.draft || "");
    const normalizedRules = normalizeRules(project.rules);
    setRules(normalizedRules);
    setMosaicTerms(project.mosaicTerms || []);
    setDesign(normalizeDesign(project.design));
    setLayout(normalizeLayout(project.layout, project.design));
    setScrapbookPages(project.scrapbookPages || {});
    setDirectMarks(normalizeDirectMarks(project.directMarks));
    setFlowBlocks(normalizeFlowBlocks(project.flowBlocks));
    setParagraphMarks(normalizeParagraphMarks(project.paragraphMarks));
    setSelectedParagraphStarts([]);
    setCurrentPage(0);
    setSelectedScrapbookElementId(null);
    setEditingRuleId(null);
    setRuleDraft({ ...emptyRuleDraft });
    setReplacementHistory([]);
    const normalized = { ...project, version: 2 as const, rules: normalizedRules, design: normalizeDesign(project.design), layout: normalizeLayout(project.layout, project.design), scrapbookPages: project.scrapbookPages || {}, directMarks: normalizeDirectMarks(project.directMarks), flowBlocks: normalizeFlowBlocks(project.flowBlocks), paragraphMarks: normalizeParagraphMarks(project.paragraphMarks) };
    setLastSavedFingerprint(JSON.stringify({ ...normalized, updatedAt: undefined }, (_key, value) => value === undefined ? undefined : value));
  }

  function persistNow(showMessage = false) {
    if (!storageReady) return;
    const saved: ProjectSnapshot = { ...snapshotBase, updatedAt: Date.now() };
    const next = projects.some((project) => project.id === saved.id) ? projects.map((project) => project.id === saved.id ? saved : project) : [saved, ...projects];
    try {
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, saved.id);
    } catch {
      setToast("브라우저 저장 공간이 부족합니다. 큰 이미지를 줄이거나 프로젝트 파일로 먼저 내보내세요.");
      return;
    }
    setProjects(next);
    setLastSavedFingerprint(fingerprint);
    setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    if (showMessage) setToast("프로젝트를 저장했습니다.");
  }

  useEffect(() => {
    try {
      const designValue = window.localStorage.getItem(DESIGNS_KEY);
      if (designValue) setSavedDesigns(JSON.parse(designValue));
      const savedPanelWidth = Number(window.localStorage.getItem(LEFT_PANEL_WIDTH_KEY));
      if (Number.isFinite(savedPanelWidth) && savedPanelWidth >= MIN_LEFT_PANEL_WIDTH) setLeftPanelWidth(clamp(savedPanelWidth, MIN_LEFT_PANEL_WIDTH, MAX_LEFT_PANEL_WIDTH));
      const raw = window.localStorage.getItem(PROJECTS_KEY);
      const activeId = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as ProjectSnapshot[];
        if (stored.length) {
          setProjects(stored);
          const active = stored.find((project) => project.id === activeId) ?? stored[0];
          applyProject(active);
          setLastSavedFingerprint(JSON.stringify({ version: 2, id: active.id, title: active.title, source: active.source, draft: active.draft, rules: active.rules || [], mosaicTerms: active.mosaicTerms || [], design: normalizeDesign(active.design), layout: normalizeLayout(active.layout, active.design), scrapbookPages: active.scrapbookPages || {}, directMarks: normalizeDirectMarks(active.directMarks), flowBlocks: normalizeFlowBlocks(active.flowBlocks), paragraphMarks: normalizeParagraphMarks(active.paragraphMarks) }));
        }
      } else {
        const legacyRaw = window.localStorage.getItem("quote-studio-project");
        if (legacyRaw) {
          const legacy = JSON.parse(legacyRaw);
          const migrated = freshProject(legacy.title || "가져온 프로젝트", legacy.source || "", legacy.draft || "");
          migrated.rules = normalizeRules(legacy.rules);
          migrated.mosaicTerms = legacy.mosaicTerms || [];
          migrated.design = normalizeDesign(legacy.design);
          setProjects([migrated]);
          applyProject(migrated);
        }
      }
    } catch {
      setToast("저장 데이터를 읽지 못해 새 작업으로 시작합니다.");
    } finally {
      setStorageReady(true);
    }
    // 저장소 마이그레이션은 최초 한 번만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(LEFT_PANEL_WIDTH_KEY, String(leftPanelWidth));
  }, [leftPanelWidth, storageReady]);

  useEffect(() => {
    if (!storageReady || !dirty) return;
    const timer = window.setTimeout(() => persistNow(false), 700);
    return () => window.clearTimeout(timer);
    // fingerprint 변화만 자동 저장을 예약합니다. persistNow의 매 렌더 함수 정체성은 의도적으로 제외합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (historyProjectRef.current !== projectId) {
      historyProjectRef.current = projectId;
      historyPastRef.current = [];
      historyFutureRef.current = [];
      historyCurrentRef.current = fingerprint;
      historyRestoringRef.current = false;
      refreshHistoryButtons();
      return;
    }
    if (historyRestoringRef.current) {
      historyRestoringRef.current = false;
      historyCurrentRef.current = fingerprint;
      return;
    }
    if (!historyCurrentRef.current || historyCurrentRef.current === fingerprint) return;
    if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = window.setTimeout(() => {
      if (historyCurrentRef.current && historyCurrentRef.current !== fingerprint) {
        historyPastRef.current.push(historyCurrentRef.current);
        historyPastRef.current = historyPastRef.current.slice(-80);
        historyFutureRef.current = [];
        historyCurrentRef.current = fingerprint;
        refreshHistoryButtons();
      }
      historyTimerRef.current = null;
    }, 320);
    return () => {
      if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    };
  }, [fingerprint, projectId, storageReady]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoProject();
      } else if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redoProject();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (canvasFitMode === "custom") return;
    const workbench = canvasWorkbenchRef.current;
    if (!workbench) return;
    let frame = window.requestAnimationFrame(() => fitCanvas(canvasFitMode));
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => fitCanvas(canvasFitMode));
    });
    observer.observe(workbench);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // 선택한 맞춤 모드에서 패널·규격 변화만 다시 계산합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasFitMode, selectedOutputSize.width, selectedOutputSize.height, layout.mode, layout.bookView, leftCollapsed, rightCollapsed]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const overlays = Array.from(canvasWorkbenchRef.current?.querySelectorAll<HTMLElement>(".central-preview-stage .preview-overlay") || []);
      setCanvasOverflow(overlays.some((overlay) => overlay.scrollHeight > overlay.clientHeight + 2));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fingerprint, currentPage, canvasZoom, selectedOutputSize.width, selectedOutputSize.height]);

  useEffect(() => {
    if (!wordSearch || inspectorTab !== "draft") return;
    const frame = window.requestAnimationFrame(() => {
      if (!editorRef.current || !editorHighlightRef.current) return;
      editorHighlightRef.current.scrollTop = editorRef.current.scrollTop;
      editorHighlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [wordSearch, searchExcludedStarts, inspectorTab, draft, layout.mosaicExclusions]);

  useEffect(() => {
    window.localStorage.setItem("quote-studio-accent", accent);
  }, [accent]);

  useEffect(() => {
    setCanvasWidthInput(String(design.canvasWidth));
  }, [design.canvasWidth]);

  useEffect(() => {
    setCanvasHeightInput(String(design.canvasHeight));
  }, [design.canvasHeight]);

  useEffect(() => {
    const anchorId = pendingRuleScrollAnchorRef.current;
    if (!anchorId || ruleEditorAnchor !== null || activeTool !== "rules") return;
    pendingRuleScrollAnchorRef.current = null;
    const frame = window.requestAnimationFrame(() => {
      const panel = toolPanelRef.current;
      if (!panel) return;
      const candidate = Array.from(panel.querySelectorAll<HTMLElement>("[data-rule-candidate]")).find((element) => element.dataset.ruleCandidate === anchorId);
      if (!candidate) return;
      const panelRect = panel.getBoundingClientRect();
      const stickyBottom = Array.from(panel.querySelectorAll<HTMLElement>(".workflow-panel-bar, .workflow-subtabs")).reduce((bottom, element) => Math.max(bottom, element.getBoundingClientRect().bottom), panelRect.top);
      const nextScrollTop = panel.scrollTop + candidate.getBoundingClientRect().top - stickyBottom - 8;
      panel.scrollTop = clamp(nextScrollTop, 0, panel.scrollHeight - panel.clientHeight);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTool, ruleEditorAnchor]);

  useEffect(() => {
    const requestedIds = new Set<FontId>([design.fontId, ...rules.map((rule) => rule.fontId).filter((fontId): fontId is FontId => fontId !== "inherit"), ...directMarks.map((mark) => mark.style.fontId).filter((fontId): fontId is FontId => fontId !== "inherit")]);
    document.querySelectorAll('[id^="quote-font-"]').forEach((element) => {
      const id = element.id.replace("quote-font-", "") as FontId;
      if (!requestedIds.has(id)) element.remove();
    });
    requestedIds.forEach((fontId) => {
      const selected = fontOptions.find((font) => font.id === fontId);
      if (!selected || document.getElementById(`quote-font-${selected.id}`)) return;
      if (selected.cssUrl) {
        const link = document.createElement("link");
        link.id = `quote-font-${selected.id}`;
        link.rel = "stylesheet";
        link.href = selected.cssUrl;
        document.head.appendChild(link);
        return;
      }
      if (selected.fileUrl) {
        const style = document.createElement("style");
        style.id = `quote-font-${selected.id}`;
        const family = selected.family.split(",")[0].replaceAll('"', "");
        style.textContent = `@font-face{font-family:"${family}";src:url("${selected.fileUrl}") format("${selected.format || "woff2"}");font-weight:${selected.weight};font-style:normal;font-display:swap;}`;
        document.head.appendChild(style);
      }
    });
  }, [design.fontId, rules, directMarks]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (currentPage >= displayPages.length) setCurrentPage(Math.max(0, displayPages.length - 1));
  }, [currentPage, displayPages.length]);

  useEffect(() => {
    setSelectedScrapbookElementId(null);
  }, [currentPage, layout.mode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleTextFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const items = await Promise.all(files.map(async (file) => {
      const raw = await file.text();
      if (file.name.toLowerCase().endsWith(".json")) {
        try {
          const value = JSON.parse(raw);
          if (value?.draft !== undefined && value?.source !== undefined) {
          const imported: ProjectSnapshot = { ...freshProject(value.title || file.name.replace(/\.json$/i, ""), value.source, value.draft), ...value, id: makeId("project"), version: 2, rules: normalizeRules(value.rules), design: normalizeDesign(value.design), layout: normalizeLayout(value.layout, value.design), scrapbookPages: value.scrapbookPages || {}, directMarks: normalizeDirectMarks(value.directMarks), flowBlocks: normalizeFlowBlocks(value.flowBlocks), paragraphMarks: normalizeParagraphMarks(value.paragraphMarks), updatedAt: Date.now() };
            return { name: file.name, source: imported.source, draft: imported.draft, project: imported };
          }
        } catch {
          // 일반 텍스트 JSON으로 처리합니다.
        }
      }
      return { name: file.name, source: raw, draft: raw };
    }));
    setPendingImport({ items, stripHtml: false, origin: "files" });
  }

  function requestSourceImport(strip = false) {
    setPendingImport({ items: [{ name: "붙여넣은 원문", source, draft: strip ? stripHtml(source) : source }], stripHtml: strip, origin: "source" });
  }

  function resolveImport(action: "new" | "append" | "replace" | "cancel") {
    if (!pendingImport || action === "cancel") {
      setPendingImport(null);
      return;
    }
    const items = pendingImport.items;
    if (action === "new") {
      persistNow(false);
      const created = items.map((item) => item.project ?? freshProject(item.name.replace(/\.[^.]+$/, "") || "새 발췌", item.source, pendingImport.stripHtml ? stripHtml(item.draft) : item.draft));
      setProjects((current) => {
        const next = [...created, ...current];
        window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
        return next;
      });
      applyProject(created[0]);
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, created[0].id);
      setToast(`${created.length}개 새 프로젝트로 가져왔습니다.`);
    } else {
      const sourceValue = items.map((item) => item.source).join("\n\n");
      const draftValue = items.map((item) => pendingImport.stripHtml ? stripHtml(item.draft) : item.draft).join("\n\n");
      if (action === "append") {
        setSource((current) => [current, sourceValue].filter(Boolean).join("\n\n"));
        setDraft((current) => [current, draftValue].filter(Boolean).join("\n\n"));
        setToast("기존 내용 뒤에 이어 붙였습니다.");
      } else {
        setSource(sourceValue);
        setDraft(draftValue);
        setRules(normalizeRules(items[0]?.project?.rules));
        setMosaicTerms(items[0]?.project?.mosaicTerms || []);
        setScrapbookPages(items[0]?.project?.scrapbookPages || {});
        setDirectMarks(normalizeDirectMarks(items[0]?.project?.directMarks));
        setFlowBlocks(normalizeFlowBlocks(items[0]?.project?.flowBlocks));
        setParagraphMarks(normalizeParagraphMarks(items[0]?.project?.paragraphMarks));
        setSelectedParagraphStarts([]);
        if (items[0]?.project) {
          setDesign(normalizeDesign(items[0].project!.design));
          setLayout(normalizeLayout(items[0].project!.layout, items[0].project!.design));
          setProjectTitle(items[0].project!.title);
        }
        setCurrentPage(0);
        setToast("현재 프로젝트 내용을 교체했습니다.");
      }
    }
    setPendingImport(null);
  }

  async function handleBackgroundFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) return setToast("30MB 이하의 배경 이미지를 선택하세요.");
    try {
      const imageBackground = await imageFileToDataUrl(file, 2400);
      setDesign((current) => ({ ...current, imageBackground, backgroundMode: "image" }));
      setToast("배경 이미지를 최적화해 불러왔습니다.");
    } catch {
      setToast("배경 이미지를 읽지 못했습니다.");
    }
  }

  async function handleAvatarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    const target = avatarTarget;
    setAvatarTarget(null);
    if (!file || !target) return;
    if (file.size > 15 * 1024 * 1024) return setToast("15MB 이하의 프로필 이미지를 선택하세요.");
    try {
      const avatar = await imageFileToDataUrl(file, 512);
      setLayout((current) => ({ ...current, speakers: current.speakers.map((speaker) => speaker.id === target ? { ...speaker, avatar } : speaker) }));
      setToast("프로필 사진을 최적화해 적용했습니다.");
    } catch {
      setToast("프로필 사진을 읽지 못했습니다.");
    }
  }

  function updateScrapbookElement(id: string, patch: Partial<ScrapbookElement>) {
    if (!visiblePage) return;
    setScrapbookPages((current) => {
      const key = scrapbookStateKey(visiblePage.id, layout.mode);
      const pageState = getScrapbookPageState(current, visiblePage, layout.mode);
      const elements = layout.mode === "scrapbook"
        ? resolveScrapbookElements(visiblePage, pageState, "paper")
        : (pageState?.elements || []).filter((element) => element.kind !== "paragraph");
      return { ...current, [key]: { elements: elements.map((element) => element.id === id ? { ...element, ...patch } : element) } };
    });
  }

  function addScrapbookDecoration(decoration: Pick<ScrapbookElement, "kind" | "src" | "sticker">) {
    if (!visiblePage) return;
    const id = makeId(decoration.kind);
    setScrapbookPages((current) => {
      const key = scrapbookStateKey(visiblePage.id, layout.mode);
      const pageState = getScrapbookPageState(current, visiblePage, layout.mode);
      const elements = layout.mode === "scrapbook"
        ? resolveScrapbookElements(visiblePage, pageState, "paper")
        : (pageState?.elements || []).filter((element) => element.kind !== "paragraph");
      const maxZ = Math.max(0, ...elements.map((element) => element.z));
      const offset = elements.filter((element) => element.kind !== "paragraph").length % 4;
      const defaultWidth = decoration.kind === "image" ? 42 : 18;
      const element: ScrapbookElement = {
        id,
        kind: decoration.kind,
        src: decoration.src,
        sticker: decoration.sticker,
        x: decoration.kind === "image" ? (100 - defaultWidth) / 2 + offset * 2 : 68 - offset * 9,
        y: decoration.kind === "image" ? 18 + offset * 5 : 10 + offset * 13,
        width: defaultWidth,
        rotation: 0,
        z: maxZ + 1,
        frameStyle: decoration.kind === "image" ? "polaroid" : "none",
      };
      return { ...current, [key]: { elements: [...elements, element] } };
    });
    setSelectedScrapbookElementId(id);
  }

  async function handleScrapbookImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return setToast("20MB 이하의 이미지를 선택하세요.");
    try {
      const src = await imageFileToDataUrl(file);
      addScrapbookDecoration({ kind: "image", src });
      setToast("사진을 현재 캔버스에 추가했습니다. 캔버스에서 끌어 옮길 수 있습니다.");
    } catch {
      setToast("사진을 읽지 못했습니다.");
    }
  }

  function alignScrapbookElement(horizontal?: "left" | "center" | "right", vertical?: "top" | "middle" | "bottom") {
    if (!selectedScrapbookElement) return;
    const patch: Partial<ScrapbookElement> = { rotation: 0 };
    if (horizontal === "left") patch.x = 5;
    if (horizontal === "center") patch.x = (100 - selectedScrapbookElement.width) / 2;
    if (horizontal === "right") patch.x = 95 - selectedScrapbookElement.width;
    if (vertical === "top") patch.y = 5;
    if (vertical === "middle") patch.y = 50;
    if (vertical === "bottom") patch.y = 88;
    updateScrapbookElement(selectedScrapbookElement.id, patch);
  }

  function bringScrapbookElementForward() {
    if (!visiblePage || !selectedScrapbookElement) return;
    const maxZ = Math.max(0, ...visibleScrapbookElements.map((element) => element.z));
    updateScrapbookElement(selectedScrapbookElement.id, { z: maxZ + 1 });
  }

  function resetOrDeleteScrapbookElement() {
    if (!visiblePage || !selectedScrapbookElement) return;
    if (selectedScrapbookElement.kind === "paragraph") {
      const paragraphs = visiblePage.text.split(/\n{2,}/).filter(Boolean);
      updateScrapbookElement(selectedScrapbookElement.id, defaultScrapbookParagraph(visiblePage, selectedScrapbookElement.paragraphIndex ?? 0, paragraphs.length, layout.mode === "manuscript" ? "none" : "paper"));
      setToast("문단 배치를 기본값으로 되돌렸습니다.");
    } else {
      setScrapbookPages((current) => {
        const key = scrapbookStateKey(visiblePage.id, layout.mode);
        const pageState = getScrapbookPageState(current, visiblePage, layout.mode);
        const elements = layout.mode === "scrapbook"
          ? resolveScrapbookElements(visiblePage, pageState, "paper")
          : (pageState?.elements || []).filter((element) => element.kind !== "paragraph");
        return { ...current, [key]: { elements: elements.filter((element) => element.id !== selectedScrapbookElement.id) } };
      });
      setSelectedScrapbookElementId(null);
      setToast("선택한 꾸미기 요소를 삭제했습니다.");
    }
  }

  function selectCandidate(candidate: Candidate) {
    if (ruleEditorAnchor === candidate.id) {
      resetRuleEditor();
      return;
    }
    const existing = rules.find((rule) => rule.start === candidate.start && rule.end === candidate.end);
    setRuleEditorAnchor(candidate.id);
    if (existing) {
      setEditingRuleId(existing.id);
      setRuleDraft(ruleToDraft(existing));
      setToast("지정된 규칙을 편집기에 불러왔습니다.");
      return;
    }
    setEditingRuleId(null);
    setRuleDraft((current) => ({ ...current, start: candidate.start, end: candidate.end }));
    setToast("기호만 채웠습니다. 의미와 표현은 직접 지정하세요.");
  }

  function beginEditRule(rule: SyntaxRule) {
    setEditingRuleId(rule.id);
    setRuleDraft(ruleToDraft(rule));
    setRuleEditorAnchor(candidates.find((candidate) => candidate.start === rule.start && candidate.end === rule.end)?.id || "manual");
  }

  function resetRuleEditor() {
    setEditingRuleId(null);
    setRuleDraft({ ...emptyRuleDraft });
    setRuleEditorAnchor(null);
  }

  function openBlankRuleEditor() {
    if (ruleEditorAnchor === "manual") {
      resetRuleEditor();
      return;
    }
    setEditingRuleId(null);
    setRuleDraft({ ...emptyRuleDraft });
    setRuleEditorAnchor("manual");
  }

  function saveRule() {
    if (!ruleDraft.start || !ruleDraft.end || !ruleDraft.label.trim()) {
      setToast("규칙 이름과 시작·종료 문자를 입력하세요.");
      return;
    }
    const signature = `${ruleDraft.start}::${ruleDraft.end}`;
    if (rules.some((rule) => rule.id !== editingRuleId && `${rule.start}::${rule.end}` === signature)) {
      setToast("같은 범위의 규칙이 이미 있습니다.");
      return;
    }
    if (editingRuleId) {
      setRules((current) => current.map((rule) => rule.id === editingRuleId ? normalizeRule({ ...rule, ...ruleDraft }) : rule));
      setToast("구문 규칙의 변경을 저장했습니다.");
    } else {
      setRules((current) => [...current, normalizeRule({ ...ruleDraft, id: makeId("rule") })]);
      setToast("사용자 지정 규칙을 추가했습니다.");
    }
    pendingRuleScrollAnchorRef.current = ruleEditorAnchor && ruleEditorAnchor !== "manual" ? ruleEditorAnchor : null;
    resetRuleEditor();
  }

  function deleteRule(id: string) {
    setRules((current) => current.filter((rule) => rule.id !== id));
    if (editingRuleId === id) resetRuleEditor();
  }

  function commitDraft(next: string) {
    if (next === draft) return;
    let prefix = 0;
    while (prefix < draft.length && prefix < next.length && draft[prefix] === next[prefix]) prefix += 1;
    let suffix = 0;
    while (suffix < draft.length - prefix && suffix < next.length - prefix && draft[draft.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix += 1;
    const oldEnd = draft.length - suffix;
    const delta = next.length - draft.length;
    setDirectMarks((current) => current.flatMap((mark) => {
      if (mark.end <= prefix) return [mark];
      if (mark.start >= oldEnd) return [{ ...mark, start: mark.start + delta, end: mark.end + delta }];
      if (mark.start <= prefix && mark.end >= oldEnd) return [{ ...mark, end: Math.max(mark.start + 1, mark.end + delta) }];
      return [];
    }));
    setLayout((current) => {
      if (!current.mosaicExclusions.length) return current;
      const mosaicExclusions = current.mosaicExclusions.flatMap((item) => {
        if (item.end <= prefix) return [item];
        if (item.start >= oldEnd) return delta === 0 ? [item] : [{ ...item, start: item.start + delta, end: item.end + delta }];
        return [];
      });
      const unchanged = mosaicExclusions.length === current.mosaicExclusions.length && mosaicExclusions.every((item, index) => item === current.mosaicExclusions[index]);
      return unchanged ? current : { ...current, mosaicExclusions };
    });
    setSearchExcludedStarts((current) => current.flatMap((start) => {
      if (start < prefix) return [start];
      if (start >= oldEnd) return [start + delta];
      return [];
    }));
    setFlowBlocks((current) => current.map((block) => block.anchor <= prefix ? block : { ...block, anchor: block.anchor >= oldEnd ? block.anchor + delta : prefix }));
    setParagraphMarks((current) => rebaseParagraphMarks(current, draft, next));
    setSelectedParagraphStarts([]);
    setDraft(next);
  }

  function toggleParagraphSelection(start: number) {
    setSelectedParagraphStarts((current) => current.includes(start) ? current.filter((value) => value !== start) : [...current, start]);
  }

  function applyParagraphMarkPatch(patch: ParagraphMarkPatch) {
    if (!selectedParagraphStarts.length) return setToast("먼저 문단을 선택하세요.");
    const selected = new Set(selectedParagraphStarts);
    setParagraphMarks((current) => {
      const untouched = current.filter((mark) => !selected.has(mark.start));
      const updated = paragraphReview.filter((paragraph) => selected.has(paragraph.start)).flatMap((paragraph) => {
        const previous = current.find((mark) => mark.start === paragraph.start);
        const role = patch.role === null ? undefined : patch.role ?? previous?.role;
        const presentation = patch.presentation === null ? undefined : patch.presentation ?? previous?.presentation;
        const color = "color" in patch ? patch.color || undefined : previous?.color;
        const bold = "bold" in patch ? patch.bold || undefined : previous?.bold;
        const italic = "italic" in patch ? patch.italic || undefined : previous?.italic;
        const presentationColor = "presentationColor" in patch ? patch.presentationColor || undefined : previous?.presentationColor;
        const lineStyle = "lineStyle" in patch ? patch.lineStyle || undefined : previous?.lineStyle;
        const linePosition = "linePosition" in patch ? patch.linePosition || undefined : previous?.linePosition;
        if (!role && !presentation && !color && !bold && !italic && !presentationColor && !lineStyle && !linePosition) return [];
        return [{
          id: previous?.id || makeId("paragraph-mark"),
          start: paragraph.start,
          end: paragraph.end,
          role,
          presentation,
          color,
          bold,
          italic,
          presentationColor,
          lineStyle,
          linePosition,
        } satisfies ParagraphMark];
      });
      return normalizeParagraphMarks([...untouched, ...updated]).sort((a, b) => a.start - b.start);
    });
    const hasFormatting = ["color", "bold", "italic", "presentationColor", "lineStyle", "linePosition"].some((key) => key in patch);
    const action = hasFormatting ? "문단 서식" : patch.presentation === "bubble" ? "말풍선" : patch.presentation === "line" ? "강조선" : patch.presentation === "quote" ? "인용선" : patch.role === "dialogue" ? "대사" : patch.role === "narration" ? "서술" : patch.role === "thought" ? "속마음" : patch.role === "other" ? "기타" : "기본 표시";
    setToast(`선택한 ${selectedParagraphStarts.length}개 문단을 ${action}로 지정했습니다.`);
  }

  function applySelectedParagraphFormatting() {
    applyParagraphMarkPatch({
      color: paragraphStyleDraft.color,
      bold: paragraphStyleDraft.bold,
      italic: paragraphStyleDraft.italic,
      presentationColor: paragraphStyleDraft.presentationColor,
      lineStyle: composeVerticalLineStyle(getLineStroke(paragraphStyleDraft.lineStyle)),
      linePosition: paragraphStyleDraft.linePosition,
    });
  }

  function applyParagraphLineDraft(patch: Partial<typeof paragraphStyleDraft> = {}) {
    const next = { ...paragraphStyleDraft, ...patch };
    const verticalLineStyle = composeVerticalLineStyle(getLineStroke(next.lineStyle));
    setParagraphStyleDraft({ ...next, lineStyle: verticalLineStyle });
    applyParagraphMarkPatch({
      presentation: next.linePurpose === "quote" ? "quote" : "line",
      presentationColor: next.presentationColor,
      lineStyle: verticalLineStyle,
      linePosition: next.linePosition,
    });
  }

  function clearSelectedParagraphMarks() {
    if (!selectedParagraphStarts.length) return setToast("먼저 문단을 선택하세요.");
    const selected = new Set(selectedParagraphStarts);
    setParagraphMarks((current) => current.filter((mark) => !selected.has(mark.start)));
    setToast("선택한 문단의 직접 지정을 해제했습니다.");
  }

  function selectUnassignedParagraphs() {
    const starts = paragraphReview.filter((paragraph) => !paragraph.mark && paragraph.detectedRole === "other").map((paragraph) => paragraph.start);
    setSelectedParagraphStarts(starts);
    setToast(starts.length ? `미지정 문단 ${starts.length}개를 선택했습니다.` : "미지정 문단이 없습니다.");
  }

  function selectParagraphsBetweenNarration() {
    const starts: number[] = [];
    let index = 0;
    while (index < paragraphReview.length) {
      if (paragraphReview[index].resolvedRole !== "other") {
        index += 1;
        continue;
      }
      const runStart = index;
      while (index < paragraphReview.length && paragraphReview[index].resolvedRole === "other") index += 1;
      const before = paragraphReview[runStart - 1];
      const after = paragraphReview[index];
      if (before?.resolvedRole === "narration" && after?.resolvedRole === "narration") {
        paragraphReview.slice(runStart, index).forEach((paragraph) => starts.push(paragraph.start));
      }
    }
    setSelectedParagraphStarts(starts);
    setToast(starts.length ? `서술 사이 문단 ${starts.length}개를 선택했습니다.` : "서술 사이에 있는 미지정 문단이 없습니다.");
  }

  function focusParagraph(start: number, end: number) {
    setInspectorTab("draft");
    setRightCollapsed(false);
    setEditorSelection({ start, end });
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(start, end);
    });
  }

  function applyDirectStyle(patch?: Partial<DirectTextStyle>) {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return setToast("먼저 수정본에서 범위를 선택하세요.");
    const style = { ...directStyleDraft, highlightColor: "transparent", ...(patch || {}) };
    style.lineStyle = verticalizeLineStyle(style.lineStyle);
    setDirectMarks((current) => [...current, { id: makeId("mark"), start, end, style, kind: "format" }]);
    setToast(style.bubbleSpeakerId ? "선택한 대사를 문단 사이 말풍선으로 지정했습니다." : "선택 영역에 직접 서식을 적용했습니다.");
    window.requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start, end); });
  }

  function clearDirectStyle() {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return setToast("서식을 지울 범위를 선택하세요.");
    setDirectMarks((current) => current.filter((mark) => mark.kind === "highlight" || mark.end <= start || mark.start >= end));
    setToast("선택 범위의 직접 서식을 지웠습니다.");
  }

  function applyHighlight(color: string) {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return setToast("먼저 수정본에서 형광펜을 칠할 범위를 선택하세요.");
    const style = { ...emptyDirectStyle, highlightColor: color };
    setDirectMarks((current) => [...current, { id: makeId("highlight"), start, end, style, kind: "highlight" }]);
    setToast("선택 영역에 형광펜을 적용했습니다.");
    window.requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start, end); });
  }

  function clearHighlight() {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return setToast("형광펜을 지울 범위를 선택하세요.");
    setDirectMarks((current) => current.flatMap((mark) => {
      if (mark.end <= start || mark.start >= end) return [mark];
      if (mark.kind === "highlight") return [];
      if (mark.style.highlightColor !== "transparent") return [{ ...mark, style: { ...mark.style, highlightColor: "transparent" } }];
      return [mark];
    }));
    setToast("선택 범위의 형광펜을 지웠습니다.");
    window.requestAnimationFrame(() => { editor.focus(); editor.setSelectionRange(start, end); });
  }

  function insertFlowBlock(type: FlowBlock["type"], patch: Partial<FlowBlock> = {}) {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? editorSelection.start ?? draft.length;
    const end = editor?.selectionEnd ?? editorSelection.end ?? start;
    const selectedText = end > start ? draft.slice(start, end).trim() : "";
    const anchor = start;
    const block: FlowBlock = {
      id: makeId("block"), anchor, type,
      text: type === "title" ? selectedText || "제목" : type === "subtitle" ? selectedText || "부제" : undefined,
      width: 72, align: "left", placement: "flow", dividerStyle: "solid", dividerLength: "long",
      dividerKind: "line", dividerOrnament: "flower", dividerColor: "#788ee0", dividerWidth: 72, dividerThickness: 1,
      dividerSpacing: 18, ornamentCount: 3, ornamentSize: 14, ornamentGap: 10, ...patch,
    };
    setFlowBlocks((current) => [...current, block]);
    if (selectedText && (type === "title" || type === "subtitle")) {
      commitDraft(`${draft.slice(0, start)}${draft.slice(end)}`);
      setEditorSelection({ start, end: start });
    }
    setToast(type === "divider" ? "가로 구분선을 넣었습니다." : type === "vertical-divider" ? "세로 구분선을 넣었습니다." : `${type === "title" ? "제목" : type === "subtitle" ? "부제" : "사진"} 블록을 넣었습니다.`);
  }

  async function handleMessagePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return setToast("20MB 이하의 이미지를 선택하세요.");
    try {
      const speaker = layout.speakers.find((item) => item.id === messagePhotoSpeakerId) || layout.speakers[0];
      const src = await imageFileToDataUrl(file);
      setFlowBlocks((current) => [...current, {
        id: makeId("photo-message"),
        anchor: editorSelection.start,
        type: "image",
        src,
        width: 100,
        align: "center",
        placement: "flow",
        photoOnly: true,
        messageSpeakerId: speaker?.id,
        time: "",
        readStatus: "",
      }]);
      setToast("텍스트 없이 사진만 있는 말풍선을 추가했습니다.");
    } catch {
      setToast("사진을 읽지 못했습니다.");
    }
  }

  function updateFlowBlock(id: string, patch: Partial<FlowBlock>) {
    setFlowBlocks((current) => current.map((block) => block.id === id ? { ...block, ...patch } : block));
  }

  function showFlowBlockAnchor(block: FlowBlock) {
    setInspectorTab("draft");
    setEditorSelection({ start: block.anchor, end: block.anchor });
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(block.anchor, block.anchor);
      const ratio = draft.length > 0 ? block.anchor / draft.length : 0;
      editor.scrollTop = Math.max(0, ratio * (editor.scrollHeight - editor.clientHeight) - editor.clientHeight * 0.25);
    });
  }

  function moveFlowBlock(block: FlowBlock, direction: -1 | 1) {
    const paragraphAnchors = Array.from(new Set([0, ...splitParagraphsWithOffsets(draft).map((paragraph) => paragraph.start), draft.length])).sort((a, b) => a - b);
    const nextAnchor = direction < 0
      ? [...paragraphAnchors].reverse().find((anchor) => anchor < block.anchor)
      : paragraphAnchors.find((anchor) => anchor > block.anchor);
    if (nextAnchor == null) return setToast(direction < 0 ? "이미 첫 문단 위치입니다." : "이미 마지막 문단 위치입니다.");
    updateFlowBlock(block.id, { anchor: nextAnchor });
    setToast(direction < 0 ? "콘텐츠 블록을 이전 문단으로 옮겼습니다." : "콘텐츠 블록을 다음 문단으로 옮겼습니다.");
  }

  function insertManualBreak() {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const scrollTop = editor.scrollTop;
    const scrollLeft = editor.scrollLeft;
    commitDraft(`${draft.slice(0, start)}${MANUAL_BREAK}${draft.slice(end)}`);
    window.requestAnimationFrame(() => {
      editor.focus();
      const caret = start + MANUAL_BREAK.length;
      editor.setSelectionRange(caret, caret);
      editor.scrollTop = scrollTop;
      editor.scrollLeft = scrollLeft;
      if (editorHighlightRef.current) {
        editorHighlightRef.current.scrollTop = scrollTop;
        editorHighlightRef.current.scrollLeft = scrollLeft;
      }
    });
    setToast("수동 페이지 경계를 넣었습니다.");
  }

  function addMosaic() {
    const term = mosaicInput.trim();
    if (!term) return;
    if (!mosaicTerms.some((item) => item.toLocaleLowerCase() === term.toLocaleLowerCase())) setMosaicTerms((current) => [...current, term]);
    setMosaicInput("");
    searchWordTerm(term);
  }

  function removeMosaicTerm(term: string) {
    setMosaicTerms((current) => current.filter((item) => item !== term));
    setLayout((current) => ({ ...current, mosaicExclusions: current.mosaicExclusions.filter((item) => item.term.toLocaleLowerCase() !== term.toLocaleLowerCase()) }));
  }

  function searchWordTerm(term: string) {
    const trimmed = term.trim();
    const registeredTerm = mosaicTerms.find((item) => item.toLocaleLowerCase() === trimmed.toLocaleLowerCase()) || "";
    const exclusions = registeredTerm
      ? findTextMatches(draft, trimmed).filter((start) => isMosaicExcluded(layout.mosaicExclusions, registeredTerm, start, start + registeredTerm.length))
      : [];
    setWordSearch(term);
    setWordMatchIndex(0);
    setSearchExcludedStarts(exclusions);
    setInspectorTab("draft");
  }

  function registerMosaicSearchTerm() {
    const term = wordSearch.trim();
    if (!term) return setToast("검색할 단어를 입력하세요.");
    if (!mosaicTerms.some((item) => item.toLocaleLowerCase() === term.toLocaleLowerCase())) setMosaicTerms((current) => [...current, term]);
    setLayout((current) => ({
      ...current,
      mosaicExclusions: [
        ...current.mosaicExclusions.filter((item) => item.term.toLocaleLowerCase() !== term.toLocaleLowerCase()),
        ...searchExcludedStarts.map((start) => ({ id: makeId("mosaic-exclusion"), term, start, end: start + term.length })),
      ],
    }));
    setToast(`‘${term}’을 익명화 단어로 등록했습니다.`);
  }

  function showWordMatch(index: number) {
    if (!wordMatches.length) return setToast("수정본에서 일치하는 위치를 찾지 못했습니다.");
    const nextIndex = (index + wordMatches.length) % wordMatches.length;
    const start = wordMatches[nextIndex];
    const length = wordSearch.trim().length;
    setWordMatchIndex(nextIndex);
    setInspectorTab("draft");
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(start, start + length);
      setEditorSelection({ start, end: start + length });
      const ratio = draft.length > 0 ? start / draft.length : 0;
      editor.scrollTop = Math.max(0, ratio * (editor.scrollHeight - editor.clientHeight) - editor.clientHeight * 0.28);
      if (editorHighlightRef.current) editorHighlightRef.current.scrollTop = editor.scrollTop;
    });
  }

  function toggleCurrentSearchExclusion() {
    if (currentWordMatch < 0) return setToast("수정본에서 일치하는 위치를 찾지 못했습니다.");
    setSearchExcludedStarts((current) => current.includes(currentWordMatch) ? current.filter((start) => start !== currentWordMatch) : [...current, currentWordMatch]);
    if (registeredMosaicSearchTerm) {
      const end = currentWordMatch + registeredMosaicSearchTerm.length;
      setLayout((current) => {
        const exists = isMosaicExcluded(current.mosaicExclusions, registeredMosaicSearchTerm, currentWordMatch, end);
        return {
          ...current,
          mosaicExclusions: exists
            ? current.mosaicExclusions.filter((item) => !(item.start === currentWordMatch && item.end === end && item.term.toLocaleLowerCase() === registeredMosaicSearchTerm.toLocaleLowerCase()))
          : [...current.mosaicExclusions, { id: makeId("mosaic-exclusion"), term: registeredMosaicSearchTerm, start: currentWordMatch, end }],
        };
      });
    }
    setToast(currentWordExcluded ? "현재 위치를 다시 선택했습니다." : "현재 위치를 선택에서 제외했습니다.");
  }

  function replaceAll() {
    const term = wordSearch.trim();
    if (!term) return setToast("찾을 단어를 입력하세요.");
    if (term === replaceTo) return setToast("찾을 단어와 바꿀 단어가 같습니다.");
    const before = draft;
    const result = replaceSelectedOccurrences(before, term, replaceTo, searchExcludedStarts, autoFixParticles);
    if (!result.count) return setToast("선택된 변경 위치가 없습니다.");
    const { text: after, count } = result;
    const record: ReplacementRecord = { id: makeId("replace"), from: term, to: replaceTo, count, before, after, createdAt: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }), undone: false };
    commitDraft(after);
    setReplacementHistory((current) => [record, ...current].slice(0, 20));
    setSearchExcludedStarts([]);
    setWordSearch("");
    setWordMatchIndex(0);
    setToast(`${count}곳을 변경했습니다.`);
  }

  function undoReplacement(record: ReplacementRecord) {
    if (record.undone) return;
    if (draft !== record.after) return setToast("이후 편집 내용이 있어 이 변경만 안전하게 취소할 수 없습니다.");
    commitDraft(record.before);
    setReplacementHistory((current) => current.map((item) => item.id === record.id ? { ...item, undone: true } : item));
    setToast(`“${record.from} → ${record.to || "삭제"}” 변경을 취소했습니다.`);
  }

  function applyCanvasRatio(ratio: string) {
    const numericRatio = parseRatio(ratio);
    setDesign((current) => ({
      ...current,
      ratio,
      ratioLocked: true,
      canvasHeight: clamp(Math.round(current.canvasWidth / numericRatio), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT),
    }));
  }

  function updateCanvasDimension(axis: "width" | "height", rawValue: number) {
    setDesign((current) => {
      const value = clamp(Math.round(rawValue || 0), MIN_CANVAS_SIZE, axis === "width" ? MAX_CANVAS_WIDTH : MAX_CANVAS_HEIGHT);
      const currentRatio = current.canvasWidth / current.canvasHeight || 4 / 5;
      if (axis === "width") return {
        ...current,
        ratio: "custom",
        canvasWidth: value,
        canvasHeight: current.ratioLocked ? clamp(Math.round(value / currentRatio), MIN_CANVAS_SIZE, MAX_CANVAS_HEIGHT) : current.canvasHeight,
      };
      return {
        ...current,
        ratio: "custom",
        canvasHeight: value,
        canvasWidth: current.ratioLocked ? clamp(Math.round(value * currentRatio), MIN_CANVAS_SIZE, MAX_CANVAS_WIDTH) : current.canvasWidth,
      };
    });
  }

  function handleCanvasDimensionInput(axis: "width" | "height", rawValue: string) {
    if (axis === "width") setCanvasWidthInput(rawValue);
    else setCanvasHeightInput(rawValue);
    if (!rawValue.trim()) return;
    const value = Number(rawValue);
    const maximum = axis === "width" ? MAX_CANVAS_WIDTH : MAX_CANVAS_HEIGHT;
    if (!Number.isFinite(value) || value < MIN_CANVAS_SIZE) return;
    updateCanvasDimension(axis, Math.min(value, maximum));
  }

  function commitCanvasDimensionInput(axis: "width" | "height") {
    const rawValue = axis === "width" ? canvasWidthInput : canvasHeightInput;
    const fallback = axis === "width" ? design.canvasWidth : design.canvasHeight;
    updateCanvasDimension(axis, Number(rawValue) || fallback);
  }

  function updatePadding(side: "paddingTop" | "paddingRight" | "paddingBottom" | "paddingLeft", rawValue: number) {
    const value = clamp(Math.round(rawValue || 0), 0, 600);
    setDesign((current) => current.paddingLinked ? {
      ...current,
      paddingTop: value,
      paddingRight: value,
      paddingBottom: value,
      paddingLeft: value,
    } : { ...current, [side]: value });
  }

  function selectLayoutMode(mode: LayoutMode) {
    setLayout((current) => ({
      ...current,
      mode,
      speakers: mode === "bubble"
        ? current.speakers.map((speaker, index) => ({
            ...speaker,
            color: speaker.color.toLowerCase() === "#fee500" ? (index % 2 ? "#dff3e8" : "#ffffff") : speaker.color,
          }))
        : current.speakers,
    }));
    setSelectedScrapbookElementId(null);
  }

  function applyMicrofilmPreset(surfaceSize: SurfaceSize) {
    const size = surfaceSize === "banner" ? { width: 1200, height: 400, ratio: "3 / 1" } : { width: 960, height: 540, ratio: "16 / 9" };
    setDesign((current) => ({ ...current, surfaceSize, canvasWidth: size.width, canvasHeight: size.height, ratio: size.ratio, ratioLocked: true }));
  }

  function applyManuscriptTemplate(template: ManuscriptTemplate) {
    setLayout((current) => ({ ...current, manuscriptTemplate: template, manuscriptMode: template }));
    setSelectedScrapbookElementId(null);
  }

  function createNewProject() {
    persistNow(false);
    const created = freshProject();
    setProjects((current) => [created, ...current]);
    applyProject(created);
    setProjectMenuOpen(false);
    setToast("빈 프로젝트를 만들었습니다.");
  }

  function switchProject(project: ProjectSnapshot) {
    persistNow(false);
    applyProject(project);
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
    setProjectMenuOpen(false);
  }

  function deleteProject(project: ProjectSnapshot) {
    if (!window.confirm(`“${project.title || "제목 없는 발췌"}” 프로젝트를 브라우저에서 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    let next = projects.filter((item) => item.id !== project.id);
    if (!next.length) next = [freshProject()];
    setProjects(next);
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
    if (project.id === projectId) {
      applyProject(next[0]);
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, next[0].id);
    }
    setToast("프로젝트를 삭제했습니다.");
  }

  function exportProject() {
    const payload = JSON.stringify({ ...snapshotBase, updatedAt: Date.now() }, null, 2);
    downloadFile(`${projectTitle || "wesea-archive"}.json`, payload, "application/json;charset=utf-8");
  }

  function saveDesign() {
    const name = designName.trim() || `디자인 ${savedDesigns.length + 1}`;
    const saved: SavedDesign = { id: makeId("design"), name, design: { ...design }, updatedAt: Date.now() };
    setSavedDesigns((current) => {
      const next = [saved, ...current];
      window.localStorage.setItem(DESIGNS_KEY, JSON.stringify(next));
      return next;
    });
    setDesignName("");
    setToast("내 디자인 보관함에 저장했습니다.");
  }

  function deleteDesign(id: string) {
    setSavedDesigns((current) => {
      const next = current.filter((item) => item.id !== id);
      window.localStorage.setItem(DESIGNS_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function getExportFontCss() {
    const fontIds = Array.from(new Set<FontId>([design.fontId, ...rules.map((rule) => rule.fontId).filter((fontId): fontId is FontId => fontId !== "inherit"), ...directMarks.map((mark) => mark.style.fontId).filter((fontId): fontId is FontId => fontId !== "inherit")]));
    const embedded = await Promise.all(fontIds.map(async (fontId) => {
      const selected = fontOptions.find((font) => font.id === fontId);
      if (!selected) return "";
      const cached = fontCssCacheRef.current[selected.id];
      if (cached !== undefined) return cached;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        let embeddedCss = "";
        if (selected.cssUrl) {
          const response = await fetch(selected.cssUrl, { signal: controller.signal });
          if (!response.ok) throw new Error(`글꼴 스타일을 불러오지 못했습니다: ${response.status}`);
          embeddedCss = await inlineFontCss(await response.text(), selected.cssUrl);
        } else if (selected.fileUrl) {
          const response = await fetch(selected.fileUrl, { signal: controller.signal });
          if (!response.ok) throw new Error(`글꼴 파일을 불러오지 못했습니다: ${response.status}`);
          const family = selected.family.split(",")[0].replaceAll('"', "");
          const dataUrl = await blobToDataUrl(await response.blob());
          embeddedCss = `@font-face{font-family:"${family}";src:url("${dataUrl}") format("${selected.format || "woff2"}");font-weight:${selected.weight};font-style:normal;font-display:swap;}`;
        }
        fontCssCacheRef.current[selected.id] = embeddedCss;
        return embeddedCss;
      } catch (error) {
        console.warn(`${selected.label} 글꼴을 이미지에 포함하지 못했습니다.`, error);
        fontCssCacheRef.current[selected.id] = "";
        return "";
      } finally {
        window.clearTimeout(timeout);
      }
    }));
    return embedded.filter(Boolean).join("\n");
  }

  async function nodeToBlob(node: HTMLElement, format: ExportFormat) {
    const { toCanvas } = await import("html-to-image");
    await document.fonts.ready;
    const fontEmbedCSS = await getExportFontCss();
    const canvas = await toCanvas(node, {
      cacheBust: true,
      pixelRatio: design.exportScale,
      backgroundColor: design.backgroundMode === "solid" ? design.solidColor : undefined,
      fontEmbedCSS,
      skipFonts: !fontEmbedCSS,
    });
    const type = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("이미지 변환 실패")), type, format === "jpeg" || format === "webp" ? 0.96 : undefined));
  }

  async function exportCurrentImage(format: ExportFormat) {
    const page = displayPages[currentPage];
    const node = page ? exportRefs.current[page.id] : null;
    if (!node || exporting) return;
    setExporting(true);
    try {
      const blob = await nodeToBlob(node, format);
      downloadBlob(`${projectTitle || "quote"}-${String(currentPage + 1).padStart(2, "0")}.${format === "jpeg" ? "jpg" : format}`, blob);
      setToast("현재 페이지 이미지를 저장했습니다.");
    } catch {
      setToast("이미지 생성에 실패했습니다. 배경 이미지와 글꼴을 확인하세요.");
    } finally {
      setExporting(false);
    }
  }

  async function copyCurrentImage() {
    const page = displayPages[currentPage];
    const node = page ? exportRefs.current[page.id] : null;
    if (!node || exporting) return;
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setToast("이 브라우저는 이미지 클립보드 복사를 지원하지 않습니다.");
      return;
    }
    setExporting(true);
    try {
      const blob = await nodeToBlob(node, "png");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setToast("현재 페이지 이미지를 클립보드에 복사했습니다.");
    } catch {
      setToast("클립보드 복사에 실패했습니다. 브라우저의 클립보드 권한을 확인하세요.");
    } finally {
      setExporting(false);
    }
  }

  async function exportAllZip() {
    if (exporting) return;
    setExporting(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let index = 0; index < displayPages.length; index += 1) {
        const node = exportRefs.current[displayPages[index].id];
        if (node) zip.file(`${String(index + 1).padStart(2, "0")}.png`, await nodeToBlob(node, "png"));
      }
      downloadBlob(`${projectTitle || "wesea-archive"}-pages.zip`, await zip.generateAsync({ type: "blob" }));
      setToast(`${displayPages.length}개 페이지를 ZIP으로 저장했습니다.`);
    } catch {
      setToast("ZIP 이미지 생성에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  }

  async function exportLongImage() {
    if (!longExportRef.current || exporting) return;
    setExporting(true);
    try {
      downloadBlob(`${projectTitle || "wesea-archive"}-long.png`, await nodeToBlob(longExportRef.current, "png"));
      setToast("긴 이미지를 저장했습니다.");
    } catch {
      setToast("긴 이미지 생성에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  }

  function updateSpeaker(id: string, patch: Partial<Speaker>) {
    setLayout((current) => ({ ...current, speakers: current.speakers.map((speaker) => speaker.id === id ? { ...speaker, ...patch } : speaker) }));
  }

  function addSpeaker() {
    const palette = ["#ffffff", "#8caae9", "#e8eefb", "#f3f6fc"];
    const accentPalette = ["#788ee0", "#6694ea", "#8caae9", "#9a72c7"];
    setLayout((current) => ({
      ...current,
      speakers: [...current.speakers, { id: makeId("speaker"), name: `위해 ${current.speakers.length + 1}`, side: "left", color: palette[current.speakers.length % palette.length], textColor: "#171719", accentColor: accentPalette[current.speakers.length % accentPalette.length], avatar: null }],
    }));
  }

  function removeSpeaker(id: string) {
    if (layout.speakers.length <= 1) return setToast("화자는 한 명 이상 필요합니다.");
    const speaker = layout.speakers.find((item) => item.id === id);
    if (!window.confirm(`“${speaker?.name || "화자"}”와 이 화자의 문단 지정을 삭제할까요?`)) return;
    setLayout((current) => {
      const assignments = Object.fromEntries(Object.entries(current.assignments).filter(([, speakerId]) => speakerId !== id));
      return { ...current, speakers: current.speakers.filter((item) => item.id !== id), assignments };
    });
    if (avatarTarget === id) setAvatarTarget(null);
  }

  function updateMessageMeta(key: string, patch: Partial<MessageMeta>) {
    setLayout((current) => {
      const previous = current.messageMeta[key] ?? { time: "", readStatus: "" };
      return {
        ...current,
        messageMeta: { ...current.messageMeta, [key]: { ...previous, ...patch } },
      };
    });
  }

  function updateCurrentPageDisplay(field: "title" | "number", value: string) {
    const pageId = visiblePage.id;
    setLayout((current) => field === "title"
      ? { ...current, pageTitleOverrides: { ...current.pageTitleOverrides, [pageId]: value } }
      : { ...current, pageNumberOverrides: { ...current.pageNumberOverrides, [pageId]: value } });
  }

  function renderOutputSizeControl() {
    const fixedMessenger = layout.mode === "messenger";
    return <div className="control-card output-size-card"><div className="history-heading"><span className="field-label">결과물 규격</span><small>템플릿과 함께 설정</small></div>
      {fixedMessenger ? <div className="fixed-size-notice"><b>{selectedOutputSize.label}</b><span>{selectedOutputSize.width} × {selectedOutputSize.height}px · 메신저 화면 설정에서 변경</span></div> : <>
        <label>페이지 비율<select value={design.ratio} onChange={(event) => event.target.value !== "custom" && applyCanvasRatio(event.target.value)}><option value="1 / 1">1:1</option><option value="4 / 5">4:5</option><option value="3 / 4">3:4</option><option value="2 / 3">2:3</option><option value="16 / 9">16:9</option><option value="9 / 16">9:16</option><option value="9 / 20">9:20</option><option value="210 / 297">A4</option><option value="3 / 1">3:1 배너</option><option value="custom">사용자 지정</option></select></label>
        <div className="canvas-size-grid"><label>너비 · px<input type="number" min={MIN_CANVAS_SIZE} max={MAX_CANVAS_WIDTH} value={canvasWidthInput} onChange={(event) => handleCanvasDimensionInput("width", event.target.value)} onBlur={() => commitCanvasDimensionInput("width")} /></label><button className={design.ratioLocked ? "is-locked" : ""} aria-label={design.ratioLocked ? "비율 잠금 해제" : "비율 잠금"} onClick={() => setDesign((current) => ({ ...current, ratioLocked: !current.ratioLocked }))}>{design.ratioLocked ? "연결" : "해제"}</button><label>높이 · px<input type="number" min={MIN_CANVAS_SIZE} max={MAX_CANVAS_HEIGHT} value={canvasHeightInput} onChange={(event) => handleCanvasDimensionInput("height", event.target.value)} onBlur={() => commitCanvasDimensionInput("height")} /></label></div>
        <div className="fixed-size-notice"><b>{selectedOutputSize.label}</b><span>{selectedOutputSize.width} × {selectedOutputSize.height}px · 저장 {selectedOutputSize.width * design.exportScale} × {selectedOutputSize.height * design.exportScale}px</span></div>
      </>}
      <button className="secondary-button full-button orientation-swap-button" onClick={() => setLayout((current) => ({ ...current, rotateOutput: !current.rotateOutput }))}>가로·세로 바꾸기</button>
    </div>;
  }

  function renderRuleBuilder(extraClassName = "") {
    return <div className={`control-card rule-builder inline-rule-builder ${extraClassName}`.trim()} role="region" aria-label={editingRuleId ? "구문 규칙 수정" : "새 구문 규칙 만들기"}>
      <div className="rule-builder-heading"><span className="field-label">{editingRuleId ? "규칙 수정" : "새 규칙 만들기"}</span><button onClick={resetRuleEditor}>닫기</button></div>
      <label>규칙 이름<input value={ruleDraft.label} onChange={(event) => setRuleDraft({ ...ruleDraft, label: event.target.value })} /></label>
      <div className="split-fields"><label>시작 문자<input value={ruleDraft.start} onChange={(event) => setRuleDraft({ ...ruleDraft, start: event.target.value })} /></label><label>종료 문자<input value={ruleDraft.end} onChange={(event) => setRuleDraft({ ...ruleDraft, end: event.target.value })} /></label></div>
      <label>의미<select value={ruleDraft.role} onChange={(event) => setRuleDraft({ ...ruleDraft, role: event.target.value as SyntaxRule["role"] })}><option value="other">기타·미지정</option><option value="narration">서술</option><option value="dialogue">대사</option><option value="status">상태창</option><option value="emphasis">강조</option></select></label>
      <div className="inline-controls"><label className="color-control">글자색<input type="color" value={ruleDraft.color} onChange={(event) => setRuleDraft({ ...ruleDraft, color: event.target.value })} /></label><label className="check-control"><input type="checkbox" checked={ruleDraft.italic} onChange={(event) => setRuleDraft({ ...ruleDraft, italic: event.target.checked })} />기울임</label><label className="check-control"><input type="checkbox" checked={ruleDraft.bold} onChange={(event) => setRuleDraft({ ...ruleDraft, bold: event.target.checked })} />굵게</label></div>
      <label>구문 글꼴<select value={ruleDraft.fontId} onChange={(event) => setRuleDraft({ ...ruleDraft, fontId: event.target.value as FontId | "inherit" })}><option value="inherit">본문 글꼴 따름</option>{orderedFonts.map((font) => <option value={font.id} key={font.id}>{font.label}</option>)}</select></label>
      <label className="range-label"><span>구문 글자 크기<b>{ruleDraft.fontScale}%</b></span><input type="range" min="50" max="240" step="5" value={ruleDraft.fontScale} onChange={(event) => setRuleDraft({ ...ruleDraft, fontScale: Number(event.target.value) })} /></label>
      <div className="rule-line-editor">
        <span className="mini-label">표현 방식</span>
        <div className="three-way-control paragraph-presentation-control"><button className={ruleDraft.presentation === "default" ? "is-selected" : ""} onClick={() => setRuleDraft({ ...ruleDraft, presentation: "default" })}>기본</button><button className={ruleDraft.presentation === "line" || ruleDraft.presentation === "quote" ? "is-selected" : ""} onClick={() => setRuleDraft({ ...ruleDraft, presentation: ruleDraft.presentation === "quote" ? "quote" : "line", lineStyle: ruleDraft.lineStyle === "none" ? "vertical-solid" : verticalizeLineStyle(ruleDraft.lineStyle) })}>선 표현</button><button className={ruleDraft.presentation === "bubble" ? "is-selected" : ""} onClick={() => setRuleDraft({ ...ruleDraft, presentation: "bubble" })}>말풍선</button></div>
        {(ruleDraft.presentation === "line" || ruleDraft.presentation === "quote") && <div className="line-composer">
          <div><span className="mini-label">용도</span><div className="two-way-control"><button className={ruleDraft.presentation === "line" ? "is-selected" : ""} onClick={() => setRuleDraft({ ...ruleDraft, presentation: "line" })}>강조</button><button className={ruleDraft.presentation === "quote" ? "is-selected" : ""} onClick={() => setRuleDraft({ ...ruleDraft, presentation: "quote" })}>인용</button></div></div>
          <div><span className="mini-label">선 종류</span><div className="four-way-control">{(["solid", "double", "dotted", "dashed"] as LineStroke[]).map((stroke) => <button className={getLineStroke(ruleDraft.lineStyle) === stroke ? "is-selected" : ""} onClick={() => setRuleDraft({ ...ruleDraft, lineStyle: composeVerticalLineStyle(stroke) })} key={stroke}>{stroke === "solid" ? "실선" : stroke === "double" ? "이중선" : stroke === "dotted" ? "점선" : "파선"}</button>)}</div></div>
          <label className="line-color-field">선 색<input type="color" value={ruleDraft.lineColor} onChange={(event) => setRuleDraft({ ...ruleDraft, lineColor: event.target.value })} /></label>
        </div>}
        {ruleDraft.presentation === "bubble" && <div className="rule-line-fields"><span className="presentation-color-description">말풍선 배경</span><label className="line-color-field">배경색<input type="color" value={ruleDraft.lineColor} onChange={(event) => setRuleDraft({ ...ruleDraft, lineColor: event.target.value })} /></label></div>}
      </div>
      <label className="check-control wide-check"><input type="checkbox" checked={ruleDraft.removeMarkers} onChange={(event) => setRuleDraft({ ...ruleDraft, removeMarkers: event.target.checked })} />미리보기에서 기호 감추기</label>
      <button className="primary-button full-button" onClick={saveRule}>{editingRuleId ? "변경 저장" : "규칙 추가"}</button>
    </div>;
  }

  function renderToolPanel() {
    if (activeTool === "import") return <div className="tool-content">
      <div className="section-heading"><span className="eyebrow">STEP 01 · SOURCE</span><h2>대사·원문 가져오기</h2><p>대사와 서술이 들어 있는 원문을 기호까지 그대로 가져옵니다.</p></div>
      <div className="control-card">
        <label className="field-label" htmlFor="source-input">직접 붙여넣기</label>
        <textarea id="source-input" className="mini-textarea" value={source} onChange={(event) => setSource(event.target.value)} placeholder="복사한 채팅을 붙여넣으세요." />
        <div className="button-row"><button className="primary-button" onClick={() => requestSourceImport(false)}>수정본으로 가져오기</button><button className="secondary-button" onClick={() => fileInputRef.current?.click()}>파일 선택</button></div>
        <input ref={fileInputRef} className="visually-hidden" type="file" multiple accept=".txt,.md,.html,.json,text/*" onChange={handleTextFiles} />
      </div>
      <div className="control-card compact-card"><div><span className="field-label">HTML 안전 처리</span><p>코드는 실행하지 않습니다. 원문을 보존한 채 태그를 제거한 결과만 수정본에 넣습니다.</p></div><button className="secondary-button full-button" onClick={() => requestSourceImport(true)}>HTML 제거 결과 가져오기</button></div>
      <div className="import-warning"><b>가져오기 전 확인</b><p>파일을 고른 뒤 새 프로젝트, 이어붙이기, 현재 내용 교체 중 하나를 다시 선택합니다. 바로 덮어쓰지 않습니다.</p></div>
      <div className="detected-box"><div className="detected-title"><span>보이는 구문 발견</span><b>{candidates.length}</b></div><p>의미는 자동 지정하지 않습니다. HTML 태그 {htmlCount}개가 감지되었습니다.</p></div>
    </div>;

    if (activeTool === "rules") return <div className="tool-content">
      <div className="section-heading"><span className="eyebrow">STEP 03 · DIALOGUE</span><h2>대사·서술 확인</h2><p>자동 감지된 기호가 대사인지 서술인지 확인하고 표현 방식을 정합니다.</p></div>
      <div className="workflow-explanation"><b>빈 줄을 기준으로 문단을 나눕니다.</b><p>별표나 따옴표 규칙은 확실한 문단만 분류합니다. 기호가 없는 문단은 사용자가 직접 선택해 대사·서술과 표현 방식을 지정할 수 있습니다.</p></div>
      {conflictCount > 0 && <div className="conflict-notice"><b>규칙 중첩 {conflictCount}곳</b><p>결과를 막지는 않습니다. 규칙 순서나 기호 범위를 조정해 충돌을 해결하세요.</p></div>}
      <div className="candidate-list">{candidates.length ? candidates.map((candidate) => {
        const assigned = assignedSignatures.has(`${candidate.start}::${candidate.end}`);
        const editorOpen = ruleEditorAnchor === candidate.id;
        return <div className={`candidate-entry ${editorOpen ? "is-open" : ""}`} data-rule-candidate={candidate.id} key={candidate.id}>
          <button className={`candidate-item ${assigned ? "is-assigned" : ""} ${editorOpen ? "is-open" : ""}`} aria-expanded={editorOpen} onClick={() => selectCandidate(candidate)}><span className="candidate-symbol">{candidate.start}</span><span><b>{candidate.name}</b><small>{candidate.count}개 · {assigned ? "지정됨" : "미지정"}</small></span><span className="candidate-action">{editorOpen ? "−" : assigned ? "✓" : "+"}</span></button>
          {editorOpen && renderRuleBuilder("candidate-rule-builder")}
        </div>;
      }) : <div className="empty-state">발견된 구문이 없습니다.</div>}
        <button className={`manual-rule-toggle ${ruleEditorAnchor === "manual" ? "is-open" : ""}`} aria-expanded={ruleEditorAnchor === "manual"} onClick={openBlankRuleEditor}>＋ 직접 새 규칙 만들기</button>
        {ruleEditorAnchor === "manual" && renderRuleBuilder("manual-rule-builder")}
      </div>
      <div className="control-card paragraph-review-card">
        <div className="history-heading"><span className="field-label">공백 기준 문단 선택</span><small>{selectedParagraphStarts.length}개 선택</small></div>
        <p className="helper-note">왼쪽 번호로 여러 문단을 함께 선택할 수 있습니다. 서로 다른 서식은 문단을 나누어 선택한 뒤 각각 적용하세요.</p>
        <div className="paragraph-selection-guide"><span><b>번호</b> 선택·해제</span><span><b>문장</b> 수정본 위치 보기</span></div>
        <div className="paragraph-quick-actions"><button onClick={selectUnassignedParagraphs}>미지정 선택</button><button onClick={selectParagraphsBetweenNarration}>서술 사이 선택</button><button onClick={() => setSelectedParagraphStarts([])}>선택 해제</button></div>
        <div className="paragraph-review-list">{paragraphReview.length ? paragraphReview.map((paragraph, index) => {
          const selected = selectedParagraphStarts.includes(paragraph.start);
          const roleLabel = paragraph.resolvedRole === "dialogue" ? "대사" : paragraph.resolvedRole === "narration" ? "서술" : paragraph.resolvedRole === "thought" ? "속마음" : "미지정";
          const presentationLabel = paragraph.resolvedPresentation === "bubble" ? "말풍선" : paragraph.resolvedPresentation === "line" ? "강조선" : paragraph.resolvedPresentation === "quote" ? "인용선" : "기본 표시";
          return <div className={`paragraph-review-item ${selected ? "is-selected" : ""}`} key={`${paragraph.start}-${index}`}>
            <button className="paragraph-check" aria-pressed={selected} aria-label={`${index + 1}번째 문단 ${selected ? "선택 해제" : "복수 선택"}`} title="여러 문단을 함께 선택할 수 있습니다" onClick={() => toggleParagraphSelection(paragraph.start)}><span>{selected ? "✓" : index + 1}</span></button>
            <button className="paragraph-review-copy" onClick={() => focusParagraph(paragraph.start, paragraph.end)}><span>{paragraph.text.slice(0, 90)}{paragraph.text.length > 90 ? "…" : ""}</span><small>{roleLabel} · {presentationLabel}{paragraph.mark ? " · 직접 지정" : paragraph.detectedRule ? ` · ${paragraph.detectedRule.label}` : ""}</small></button>
          </div>;
        }) : <div className="empty-state">수정본에 확인할 문단이 없습니다.</div>}</div>
        <div className="paragraph-batch-editor">
          <span className="mini-label">문장 종류</span><div className="four-way-control"><button onClick={() => applyParagraphMarkPatch({ role: "dialogue" })}>대사</button><button onClick={() => applyParagraphMarkPatch({ role: "narration" })}>서술</button><button onClick={() => applyParagraphMarkPatch({ role: "thought" })}>속마음</button><button onClick={() => applyParagraphMarkPatch({ role: "other" })}>기타</button></div>
          <span className="mini-label">표현 방식</span><div className="three-way-control paragraph-presentation-control"><button onClick={() => applyParagraphMarkPatch({ presentation: null })}>기본</button><button onClick={() => applyParagraphLineDraft()}>선 표현</button><button onClick={() => applyParagraphMarkPatch({ presentation: "bubble", presentationColor: paragraphStyleDraft.presentationColor })}>말풍선</button></div>
          <div className="paragraph-format-editor">
            <span className="mini-label">문단 서식</span>
            <label className="color-control">글자색<input type="color" value={paragraphStyleDraft.color} onChange={(event) => setParagraphStyleDraft((current) => ({ ...current, color: event.target.value }))} /></label>
            <div className="inline-controls paragraph-emphasis-controls"><label className="check-control"><input type="checkbox" checked={paragraphStyleDraft.bold} onChange={(event) => setParagraphStyleDraft((current) => ({ ...current, bold: event.target.checked }))} />굵게</label><label className="check-control"><input type="checkbox" checked={paragraphStyleDraft.italic} onChange={(event) => setParagraphStyleDraft((current) => ({ ...current, italic: event.target.checked }))} />기울임</label></div>
            <label className="color-control">표현 색<input aria-label="문단 표현 색" type="color" value={paragraphStyleDraft.presentationColor} onChange={(event) => setParagraphStyleDraft((current) => ({ ...current, presentationColor: event.target.value }))} /></label>
            <div className="line-composer">
              <div><span className="mini-label">용도</span><div className="two-way-control"><button className={paragraphStyleDraft.linePurpose === "emphasis" ? "is-selected" : ""} onClick={() => applyParagraphLineDraft({ linePurpose: "emphasis" })}>강조</button><button className={paragraphStyleDraft.linePurpose === "quote" ? "is-selected" : ""} onClick={() => applyParagraphLineDraft({ linePurpose: "quote" })}>인용</button></div></div>
              <div><span className="mini-label">선 종류</span><div className="four-way-control">{(["solid", "double", "dotted", "dashed"] as LineStroke[]).map((stroke) => <button className={getLineStroke(paragraphStyleDraft.lineStyle) === stroke ? "is-selected" : ""} onClick={() => applyParagraphLineDraft({ lineStyle: composeVerticalLineStyle(stroke) })} key={stroke}>{stroke === "solid" ? "실선" : stroke === "double" ? "이중선" : stroke === "dotted" ? "점선" : "파선"}</button>)}</div></div>
            </div>
            <button className="primary-button full-button" onClick={applySelectedParagraphFormatting}>선택 문단에 서식 적용</button>
          </div>
          <button className="secondary-button full-button" onClick={clearSelectedParagraphMarks}>직접 지정 해제 · 구문 규칙 따름</button>
        </div>
      </div>
      {rules.length > 0 && <div className="rule-list">{rules.map((rule) => <div className={`rule-chip ${editingRuleId === rule.id ? "is-editing" : ""}`} key={rule.id}><span className="rule-dot" style={{ background: rule.color }} /><span><b>{rule.label}</b><small>{rule.start} … {rule.end}</small></span><div className="rule-actions"><button aria-label={`${rule.label} 규칙 수정`} onClick={() => beginEditRule(rule)}>수정</button><button aria-label={`${rule.label} 규칙 삭제`} onClick={() => deleteRule(rule.id)}>×</button></div></div>)}</div>}
      {["bubble", "messenger"].includes(layout.mode) && <div className="control-card dialogue-character-card"><div className="history-heading"><span className="field-label">메신저 화자 구분</span><button className="speaker-add-button" onClick={addSpeaker}>＋ 캐릭터 추가</button></div><p className="helper-note">말풍선·메신저 템플릿에서만 화자와 좌우 방향을 사용합니다. 일반 레이아웃의 문단 말풍선에는 이름이 표시되지 않습니다.</p><label className="check-control wide-check"><input type="checkbox" checked={layout.dialogueShowNames} onChange={(event) => setLayout((current) => ({ ...current, dialogueShowNames: event.target.checked }))} />캔버스에 캐릭터명 표시</label><div className="dialogue-character-list">{layout.speakers.map((speaker) => <div className="dialogue-character-editor" key={speaker.id}><input aria-label="대사 캐릭터명" value={speaker.name} onChange={(event) => updateSpeaker(speaker.id, { name: event.target.value })} placeholder="위해" /><input aria-label={`${speaker.name} 강조선 색`} title="강조선 색" type="color" value={speaker.accentColor} onChange={(event) => updateSpeaker(speaker.id, { accentColor: event.target.value })} /><button aria-label={`${speaker.name} 캐릭터 삭제`} disabled={layout.speakers.length <= 1} onClick={() => removeSpeaker(speaker.id)}>삭제</button></div>)}</div>{dialogueParagraphs.length ? <div className="dialogue-assignment-list">{dialogueParagraphs.map((paragraph) => { const key = `text:${paragraph.start}`; return <label key={key}><span>{paragraph.text.slice(0, 46)}{paragraph.text.length > 46 ? "…" : ""}</span><select value={layout.assignments[key] || ""} onChange={(event) => setLayout((current) => ({ ...current, assignments: { ...current.assignments, [key]: event.target.value } }))}><option value="">미지정</option>{layout.speakers.map((speaker) => <option value={speaker.id} key={speaker.id}>{speaker.name}</option>)}</select></label>; })}</div> : <div className="empty-state">의미가 ‘대사’인 구문 규칙을 만들면 문단별 지정 항목이 나타납니다.</div>}</div>}
    </div>;

    if (activeTool === "edit") return <div className="tool-content">
      <div className="section-heading"><span className="eyebrow">STEP 03 · CONTENT</span><h2>본문·문단 장식</h2><p>본문을 다듬고 선택 서식, 문단 구분 장식과 페이지 경계를 정합니다.</p></div>
      <div className="control-card highlight-card"><div className="history-heading"><span className="field-label">형광펜</span><small>{directMarks.filter((mark) => mark.kind === "highlight" || mark.style.highlightColor !== "transparent").length}개 적용</small></div><p className="helper-note">형광펜은 구문 규칙과 다른 선택 서식보다 항상 위에 표시됩니다.</p>
        <div className="highlight-card-controls"><label className="color-control">형광펜 색<input type="color" value={directStyleDraft.highlightColor === "transparent" ? "#fff0a8" : directStyleDraft.highlightColor} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, highlightColor: event.target.value }))} /></label><button className="primary-button" onClick={() => applyHighlight(directStyleDraft.highlightColor === "transparent" ? "#fff0a8" : directStyleDraft.highlightColor)}>선택 영역에 적용</button><button className="secondary-button" onClick={clearHighlight}>선택 영역에서 제거</button></div>
      </div>
      <div className="control-card direct-style-card"><div className="history-heading"><span className="field-label">글자 서식</span><small>{directMarks.filter((mark) => mark.kind !== "highlight").length}개 적용</small></div><p className="helper-note">본문 기본색은 전체 글자에 적용됩니다. 선택 글자색과 나머지 서식은 수정본에서 선택한 범위만 바꿉니다.</p>
        <div className="text-color-pair"><label className="color-control">본문 기본색<input type="color" value={design.textColor} onChange={(event) => setDesign((current) => ({ ...current, textColor: event.target.value }))} /></label><label className="color-control">선택 글자색<input type="color" value={directStyleDraft.color} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, color: event.target.value }))} /></label></div>
        <span className="quick-style-label">선택 영역 서식 지정</span>
        <div className="quick-style-row"><button className="format-icon-button" aria-label="선택 영역 굵게" title="굵게" onClick={() => applyDirectStyle({ bold: true })}><span className="format-icon is-bold" aria-hidden="true">B</span><span>굵게</span></button><button className="format-icon-button" aria-label="선택 영역 기울임" title="기울임" onClick={() => applyDirectStyle({ italic: true })}><span className="format-icon is-italic" aria-hidden="true">I</span><span>기울임</span></button><button aria-label="선택 영역 서식 지우기" onClick={clearDirectStyle}>서식 지우기</button></div>
        <label>글꼴<select value={directStyleDraft.fontId} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, fontId: event.target.value as FontId | "inherit" }))}><option value="inherit">본문 글꼴 따름</option>{orderedFonts.map((font) => <option value={font.id} key={font.id}>{font.label}</option>)}</select></label>
        <label className="range-label"><span>선택 글자 크기<b>{directStyleDraft.fontScale}%</b></span><input type="range" min="50" max="240" step="5" value={directStyleDraft.fontScale} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, fontScale: Number(event.target.value) }))} /></label>
        <div className="inline-controls"><label className="check-control"><input type="checkbox" checked={directStyleDraft.bold} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, bold: event.target.checked }))} />굵게</label><label className="check-control"><input type="checkbox" checked={directStyleDraft.italic} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, italic: event.target.checked }))} />기울임</label></div>
        <div className="rule-line-editor direct-line-editor"><div className="rule-line-fields"><label>선과 구분<select value={verticalizeLineStyle(directStyleDraft.lineStyle)} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, lineStyle: event.target.value as TextLineStyle }))}>{textLineStyleOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label className="line-color-field">선 색<input type="color" value={directStyleDraft.lineColor} onChange={(event) => setDirectStyleDraft((current) => ({ ...current, lineColor: event.target.value }))} /></label></div></div>
        <button className="primary-button full-button" onClick={() => applyDirectStyle()}>선택 영역에 적용</button>
      </div>
      <div className="control-card attribution-control">
        <div className="history-heading"><span className="field-label">발췌 정보</span><small>모든 템플릿</small></div>
        <label className="check-control wide-check"><input type="checkbox" checked={layout.attributionVisible} onChange={(event) => setLayout((current) => ({ ...current, attributionVisible: event.target.checked }))} />캔버스에 발췌 정보 표시</label>
        <div className="split-fields"><label>캐릭터명<input value={layout.attributionCharacter} maxLength={60} onChange={(event) => setLayout((current) => ({ ...current, attributionCharacter: event.target.value }))} placeholder="예: 위해" /></label><label>제작자<input value={layout.attributionCreator} maxLength={60} onChange={(event) => setLayout((current) => ({ ...current, attributionCreator: event.target.value }))} placeholder="예: wesea" /></label></div>
        <label>플랫폼명<input value={layout.attributionPlatform} maxLength={80} onChange={(event) => setLayout((current) => ({ ...current, attributionPlatform: event.target.value }))} placeholder="예: site name" /></label>
        <p className="helper-note">캐릭터명과 제작자는 첫 줄, 플랫폼명은 둘째 줄에 표시됩니다. 입력하지 않은 항목은 보이지 않으며, 아래에서 정보 전체의 위치와 두 줄 사이 간격을 조정할 수 있습니다.</p>
        {layout.attributionVisible && <div className="attribution-position-controls">
          <span className="mini-label">발췌 정보 박스 위치</span>
          <label className="range-label"><span>가로 위치<b>{layout.attributionX}%</b></span><input type="range" min="0" max="100" value={layout.attributionX} onChange={(event) => setLayout((current) => ({ ...current, attributionX: Number(event.target.value) }))} /></label>
          <label className="range-label"><span>세로 위치<b>{layout.attributionY}%</b></span><input type="range" min="0" max="100" value={layout.attributionY} onChange={(event) => setLayout((current) => ({ ...current, attributionY: Number(event.target.value) }))} /></label>
          <label className="range-label"><span>플랫폼 가로 위치<b>{layout.attributionGap}px</b></span><input type="range" min="-400" max="400" step="1" value={layout.attributionGap} onChange={(event) => setLayout((current) => ({ ...current, attributionGap: Number(event.target.value) }))} /></label>
          <label className="range-label"><span>플랫폼 세로 단차<b>{layout.attributionPlatformOffsetY}px</b></span><input type="range" min="0" max="100" value={layout.attributionPlatformOffsetY} onChange={(event) => setLayout((current) => ({ ...current, attributionPlatformOffsetY: Number(event.target.value) }))} /></label>
          <button className="secondary-button full-button" onClick={() => setLayout((current) => ({ ...current, attributionX: 50, attributionY: 84, attributionGap: 0, attributionPlatformOffsetY: 12 }))}>위치·간격 초기화</button>
        </div>}
      </div>
      <div className="control-card flow-block-card">
        <div className="history-heading"><span className="field-label">문단 구분 장식</span><small>모양·색·간격 조정</small></div>
        <p className="helper-note">수정본에서 장식을 넣을 문단에 커서를 놓고 추가하세요. 선, 장식, 혼합형 중에서 원하는 모양을 고를 수 있습니다.</p>
        <button className="primary-button full-button" onClick={() => insertFlowBlock("divider", { dividerKind: "line" })}>＋ 문단 구분 장식 추가</button>
        {flowBlocks.some((block) => block.type === "divider") && <div className="flow-block-list">{[...flowBlocks].filter((block) => block.type === "divider").sort((a, b) => a.anchor - b.anchor).map((block) => <div key={block.id}>
          <span className="flow-anchor">{describeTextPosition(draft, block.anchor)} · 문단 구분 장식</span>
          <div className="divider-kind-picker" aria-label="장식 형식">{(["line", "ornament", "mixed"] as DividerKind[]).map((kind) => <button className={(block.dividerKind || "line") === kind ? "is-selected" : ""} onClick={() => updateFlowBlock(block.id, { dividerKind: kind })} key={kind}>{kind === "line" ? "선" : kind === "ornament" ? "SVG" : "선 + SVG"}</button>)}</div>
          <div className="divider-block-editor"><div className="split-fields"><label>정렬<select value={block.align || "left"} onChange={(event) => updateFlowBlock(block.id, { align: event.target.value as TextAlign })}><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></label><label className="color-control">색상<input type="color" value={block.dividerColor || "#788ee0"} onChange={(event) => updateFlowBlock(block.id, { dividerColor: event.target.value })} /></label></div>{block.dividerKind !== "line" && <><span className="mini-label">SVG 모양</span><div className="ornament-visual-picker">{dividerOrnamentOptions.map((option) => <button className={(block.dividerOrnament || "flower") === option.value ? "is-selected" : ""} aria-label={option.label} title={option.label} onClick={() => updateFlowBlock(block.id, { dividerOrnament: option.value })} key={option.value}><DividerOrnamentSvg type={option.value} /></button>)}</div>{block.dividerKind === "ornament" && <label className="range-label"><span>반복 개수<b>{block.ornamentCount ?? 3}개</b></span><input type="range" min="1" max="9" value={block.ornamentCount ?? 3} onChange={(event) => updateFlowBlock(block.id, { ornamentCount: Number(event.target.value) })} /></label>}<label className="range-label"><span>SVG 크기<b>{block.ornamentSize ?? 14}px</b></span><input type="range" min="6" max="48" value={block.ornamentSize ?? 14} onChange={(event) => updateFlowBlock(block.id, { ornamentSize: Number(event.target.value) })} /></label><label className="range-label"><span>{block.dividerKind === "mixed" ? "선·SVG 간격" : "SVG 간격"}<b>{block.ornamentGap ?? 10}px</b></span><input type="range" min="0" max="40" value={block.ornamentGap ?? 10} onChange={(event) => updateFlowBlock(block.id, { ornamentGap: Number(event.target.value) })} /></label></>}{block.dividerKind !== "ornament" && <><label>선 종류<select value={block.dividerStyle || "solid"} onChange={(event) => updateFlowBlock(block.id, { dividerStyle: event.target.value as FlowBlock["dividerStyle"] })}><option value="solid">실선</option><option value="double">이중선</option><option value="dotted">점선</option><option value="dashed">파선</option></select></label><label className="range-label"><span>전체 길이<b>{block.dividerWidth ?? 72}%</b></span><input type="range" min="12" max="100" value={block.dividerWidth ?? 72} onChange={(event) => updateFlowBlock(block.id, { dividerWidth: Number(event.target.value) })} /></label><label className="range-label"><span>선 두께<b>{block.dividerThickness ?? 1}px</b></span><input type="range" min="1" max="8" value={block.dividerThickness ?? 1} onChange={(event) => updateFlowBlock(block.id, { dividerThickness: Number(event.target.value) })} /></label></>}<label className="range-label"><span>위·아래 여백<b>{block.dividerSpacing ?? 18}px</b></span><input type="range" min="0" max="80" value={block.dividerSpacing ?? 18} onChange={(event) => updateFlowBlock(block.id, { dividerSpacing: Number(event.target.value) })} /></label></div>
          <div className="flow-block-actions"><button onClick={() => showFlowBlockAnchor(block)}>위치 보기</button><button aria-label="이전 문단으로 이동" onClick={() => moveFlowBlock(block, -1)}>↑</button><button aria-label="다음 문단으로 이동" onClick={() => moveFlowBlock(block, 1)}>↓</button><button aria-label="요소 삭제" onClick={() => setFlowBlocks((current) => current.filter((item) => item.id !== block.id))}>삭제</button></div>
        </div>)}</div>}
      </div>
      <div className="control-card free-photo-card">
        <span className="field-label">{["bubble", "messenger"].includes(layout.mode) ? "사진 메시지" : "사진"}</span>
        {["bubble", "messenger"].includes(layout.mode) ? <>
          <label>화자<select value={messagePhotoSpeakerId} onChange={(event) => setMessagePhotoSpeakerId(event.target.value)}>{layout.speakers.map((speaker) => <option value={speaker.id} key={speaker.id}>{speaker.name} · {speaker.side === "left" ? "왼쪽" : "오른쪽"}</option>)}</select></label>
          <button className="secondary-button full-button" onClick={() => messagePhotoInputRef.current?.click()}>＋ 사진만 있는 말풍선</button>
          <input ref={messagePhotoInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleMessagePhoto} />
          {flowBlocks.filter((block) => block.photoOnly).map((block) => <div className="photo-message-editor" key={block.id}><select value={block.messageSpeakerId || ""} onChange={(event) => updateFlowBlock(block.id, { messageSpeakerId: event.target.value })}>{layout.speakers.map((speaker) => <option value={speaker.id} key={speaker.id}>{speaker.name}</option>)}</select><input aria-label="사진 메시지 시간" type="time" value={block.time || ""} onChange={(event) => updateFlowBlock(block.id, { time: event.target.value })} /><input aria-label="사진 메시지 읽음" value={block.readStatus || ""} onChange={(event) => updateFlowBlock(block.id, { readStatus: event.target.value })} placeholder="읽음" /><button onClick={() => setFlowBlocks((current) => current.filter((item) => item.id !== block.id))}>삭제</button></div>)}
        </> : <>
          <p className="helper-note">사진을 추가한 뒤 미리보기에서 끌어 위치를 옮기고, 아래에서 크기와 프레임을 조정하세요.</p>
          <button className="secondary-button full-button" onClick={() => scrapbookImageInputRef.current?.click()}>＋ 사진 추가</button>
          <input ref={scrapbookImageInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleScrapbookImage} />
          {selectedScrapbookElement?.kind === "image" && <div className="free-photo-inspector">
            <span className="mini-label">사진 프레임</span>
            <div className="frame-choice-grid">{([
              ["none", "없음"], ["outline", "얇은 선"], ["paper", "종이 여백"], ["polaroid", "폴라로이드"], ["grid", "원고지 칸"], ["film", "필름"],
            ] as Array<[ScrapbookFrameStyle, string]>).map(([id, label]) => <button className={selectedScrapbookElement.frameStyle === id ? "is-selected" : ""} onClick={() => updateScrapbookElement(selectedScrapbookElement.id, { frameStyle: id })} key={id}>{label}</button>)}</div>
            <label className="range-label"><span>사진 폭<b>{Math.round(selectedScrapbookElement.width)}%</b></span><input type="range" min="10" max="100" value={selectedScrapbookElement.width} onChange={(event) => updateScrapbookElement(selectedScrapbookElement.id, { width: Number(event.target.value), x: Math.min(selectedScrapbookElement.x, 100 - Number(event.target.value)) })} /></label>
            <div className="split-fields"><label>가로 위치 · %<input type="number" min="0" max={100 - selectedScrapbookElement.width} value={Math.round(selectedScrapbookElement.x)} onChange={(event) => updateScrapbookElement(selectedScrapbookElement.id, { x: clamp(Number(event.target.value), 0, 100 - selectedScrapbookElement.width) })} /></label><label>세로 위치 · %<input type="number" min="0" max="94" value={Math.round(selectedScrapbookElement.y)} onChange={(event) => updateScrapbookElement(selectedScrapbookElement.id, { y: clamp(Number(event.target.value), 0, 94) })} /></label></div>
            <div className="three-way-control"><button onClick={() => alignScrapbookElement("left")}>왼쪽</button><button onClick={() => alignScrapbookElement("center")}>정중앙</button><button onClick={() => alignScrapbookElement("right")}>오른쪽</button></div>
            <div className="two-way-control"><button onClick={bringScrapbookElementForward}>맨 앞으로</button><button onClick={resetOrDeleteScrapbookElement}>사진 삭제</button></div>
          </div>}
        </>}
      </div>
      <div className="control-card"><span className="field-label">페이지 분할</span><button className="secondary-button full-button" onClick={insertManualBreak}>커서 위치에 수동 경계 넣기</button><label className="check-control wide-check"><input type="checkbox" checked={layout.autoPaginate} onChange={(event) => setLayout((current) => ({ ...current, autoPaginate: event.target.checked }))} />남은 넘침 자동 분할</label>{layout.autoPaginate && <><label>자동 분할 기준<select value={layout.paginationBasis} onChange={(event) => setLayout((current) => ({ ...current, paginationBasis: event.target.value as PaginationBasis }))}><option value="canvas">현재 캔버스·여백·글자 크기</option><option value="characters">직접 지정한 글자 수</option></select></label>{layout.paginationBasis === "canvas" ? <div className="fixed-size-notice"><b>현재 규격 예상량</b><span>페이지당 약 {estimatedPageCapacity.toLocaleString()}자 · 문단 우선</span></div> : <label className="range-label"><span>페이지당 목표 글자<b>{layout.pageCapacity.toLocaleString()}자</b></span><input type="range" min="120" max="6000" step="20" value={layout.pageCapacity} onChange={(event) => setLayout((current) => ({ ...current, pageCapacity: Number(event.target.value) }))} /></label>}</>}<p className="helper-note">자동 분할은 캔버스에 맞춰 문단을 다음 페이지로 넘깁니다. 직접 넣은 수동 경계가 우선 적용됩니다.</p></div>
      <div className="stats-grid"><div><b>{charCount.toLocaleString()}</b><span>글자</span></div><div><b>{draft.split(/\s+/).filter(Boolean).length.toLocaleString()}</b><span>단어</span></div><div><b>{displayPages.length}</b><span>페이지</span></div></div>
    </div>;

    if (activeTool === "privacy") return <div className="tool-content">
      <div className="section-heading"><span className="eyebrow">STEP 03 · PRIVACY</span><h2>찾기·익명화·교체</h2><p>하나의 검색 결과에서 위치별 대상을 고른 뒤 변경하거나 가립니다.</p></div>
      <div className="control-card word-search-card">
        <div className="history-heading"><span className="field-label">단어 위치 검색</span>{wordSearch && <button className="search-cancel-button" onClick={() => { setWordSearch(""); setWordMatchIndex(0); setSearchExcludedStarts([]); }}><span aria-hidden="true">×</span> 검색 취소</button>}</div>
        <input aria-label="단어 위치 검색어" value={wordSearch} onChange={(event) => searchWordTerm(event.target.value)} placeholder="이름 또는 단어" />
        {wordSearch.trim() && <>
          <div className="word-search-summary"><span>검색 결과</span><b>{selectedWordMatchCount.toLocaleString()} / {wordMatches.length.toLocaleString()}곳 선택</b></div>
          <div className="word-search-navigation"><button disabled={!wordMatches.length} onClick={() => showWordMatch(currentWordDisplayIndex - 1)}>← 이전</button><span>{wordMatches.length ? `${currentWordDisplayIndex + 1} / ${wordMatches.length}` : "일치 없음"}</span><button disabled={!wordMatches.length} onClick={() => showWordMatch(currentWordDisplayIndex + 1)}>다음 →</button></div>
          <button className={`full-button ${currentWordExcluded ? "secondary-button" : "primary-button"}`} disabled={!wordMatches.length} onClick={toggleCurrentSearchExclusion}>{currentWordExcluded ? "현재 위치 다시 선택" : "현재 위치 선택 해제"}</button>
          {!registeredMosaicSearchTerm && <button className="secondary-button full-button word-search-register" onClick={registerMosaicSearchTerm}>선택한 위치만 익명화 단어로 추가</button>}
          <p className="helper-note">바꾸거나 숨기지 않을 위치는 선택을 해제하세요. 해제한 단어는 파란 마킹이 사라지고 익명화와 교체 대상에서 함께 빠집니다.</p>
        </>}
      </div>
      <div className="control-card mosaic-control-card">
        <label className="field-label" htmlFor="mosaic-word">숨길 단어</label>
        <div className="joined-input"><input id="mosaic-word" value={mosaicInput} onChange={(event) => setMosaicInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addMosaic()} placeholder="이름 또는 단어" /><button onClick={addMosaic}>추가</button></div>
        <span className="mini-label">표시 방식</span>
        <div className="two-way-control"><button className={design.mosaicMode === "black" ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, mosaicMode: "black" }))}>검은 채움</button><button className={design.mosaicMode === "blank" ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, mosaicMode: "blank" }))}>빈칸 숨김</button></div>
        <p className="helper-note">추가한 단어는 캔버스에서만 가려집니다. 단어를 누르면 검색 결과로 이동해 가릴 위치를 하나씩 확인할 수 있습니다.</p>
        <div className="tag-list">{mosaicTerms.map((term) => <span className="privacy-tag" key={term}><button className="privacy-tag-query" onClick={() => searchWordTerm(term)}>{term}</button><button aria-label={`${term} 익명화 단어 삭제`} onClick={() => removeMosaicTerm(term)}>×</button></span>)}</div>
      </div>
      <div className="control-card"><div className="history-heading"><span className="field-label">일괄 단어 변경</span><small>{selectedWordMatchCount.toLocaleString()}곳 선택</small></div><div className="shared-search-value"><span>검색 단어</span><b>{wordSearch.trim() || "위 검색에서 단어를 입력하세요"}</b></div><label>바꿀 단어<input value={replaceTo} onChange={(event) => setReplaceTo(event.target.value)} placeholder="wesea" /></label>
        <div className="replace-location">
          <div className="replace-result-bar"><span>변경 대상</span><b>{selectedWordMatchCount.toLocaleString()} / {wordMatches.length.toLocaleString()}곳</b></div>
          <small>위 검색에서 해제하지 않은 위치만 변경합니다.</small>
        </div>
        <label className="check-control wide-check"><input type="checkbox" checked={autoFixParticles} onChange={(event) => setAutoFixParticles(event.target.checked)} />바뀐 이름 뒤의 한국어 조사 자동 보정</label><button className="primary-button full-button" disabled={!wordSearch.trim() || selectedWordMatchCount === 0} onClick={replaceAll}>선택한 {selectedWordMatchCount.toLocaleString()}곳 변경</button></div>
      <div className="control-card replacement-card"><div className="history-heading"><span className="field-label">최근 변경</span><small>최대 20개</small></div>{replacementHistory.length ? <div className="replacement-list">{replacementHistory.map((record) => {
        const canUndo = !record.undone && draft === record.after;
        return <div className={`replacement-item ${record.undone ? "is-undone" : ""}`} key={record.id}><div><b><span>{record.from}</span><i>→</i><span>{record.to || "삭제"}</span></b><small>{record.count}곳 · {record.createdAt}</small></div><button disabled={!canUndo} onClick={() => undoReplacement(record)}>{record.undone ? "취소됨" : canUndo ? "되돌리기" : "편집됨"}</button></div>;
      })}</div> : <div className="empty-history">변경하면 ‘원본 → 변경값’과 개수가 여기에 기록됩니다.</div>}</div>
    </div>;

    if (activeTool === "design") {
      const modes: Array<{ id: BackgroundMode; label: string }> = [{ id: "solid", label: "단색" }, { id: "gradient", label: "그라데이션" }, { id: "image", label: "이미지" }, { id: "dot", label: "도트" }, { id: "radial", label: "빛번짐" }, { id: "check", label: "체크" }];
      return <div className="tool-content">
        <div className="section-heading"><span className="eyebrow">STEP 04 · DESIGN</span><h2>시각 디자인</h2><p>선택한 템플릿의 배경, 글꼴, 간격과 여백을 조정합니다.</p></div>
        <div className="structure-guide"><b>디자인</b><span>보이는 방식</span><i>배경 · 글꼴 · 색 · 여백</i></div>
        <div className="control-card"><span className="field-label">배경</span><div className="mode-grid">{modes.map((mode) => <button className={design.backgroundMode === mode.id ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, backgroundMode: mode.id }))} key={mode.id}>{mode.label}</button>)}</div>
          {design.backgroundMode === "solid" && <><div className="output-swatches">{outputColorPresets.map((color) => <button aria-label={`${color} 배경색`} className={design.solidColor === color ? "is-selected" : ""} style={{ background: color }} onClick={() => setDesign((current) => ({ ...current, solidColor: color }))} key={color} />)}</div><label className="color-row">직접 선택<input type="color" value={design.solidColor} onChange={(event) => setDesign((current) => ({ ...current, solidColor: event.target.value }))} /></label></>}
          {design.backgroundMode === "gradient" && <><div className="gradient-row three-colors"><label>시작<input type="color" value={design.gradientStart} onChange={(event) => setDesign((current) => ({ ...current, gradientStart: event.target.value }))} /></label><label>중간<input type="color" value={design.gradientMiddle} onChange={(event) => setDesign((current) => ({ ...current, gradientMiddle: event.target.value }))} /></label><label>끝<input type="color" value={design.gradientEnd} onChange={(event) => setDesign((current) => ({ ...current, gradientEnd: event.target.value }))} /></label></div><label className="range-label"><span>그라데이션 방향<b>{design.gradientDirection}°</b></span><input type="range" min="0" max="360" value={design.gradientDirection} onChange={(event) => setDesign((current) => ({ ...current, gradientDirection: Number(event.target.value) }))} /></label></>}
          {design.backgroundMode === "image" && <><button className="secondary-button full-button" onClick={() => imageInputRef.current?.click()}>배경 이미지 불러오기</button><input ref={imageInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleBackgroundFile} /><label>이미지 맞춤<select value={design.imageFit} onChange={(event) => setDesign((current) => ({ ...current, imageFit: event.target.value as ImageFit }))}><option value="cover">채우기</option><option value="contain">전체 보이기</option><option value="stretch">늘여 맞춤</option></select></label><div className="split-fields"><label>가로 위치<input type="number" min="0" max="100" value={design.imagePositionX} onChange={(event) => setDesign((current) => ({ ...current, imagePositionX: clamp(Number(event.target.value), 0, 100) }))} /></label><label>세로 위치<input type="number" min="0" max="100" value={design.imagePositionY} onChange={(event) => setDesign((current) => ({ ...current, imagePositionY: clamp(Number(event.target.value), 0, 100) }))} /></label></div><label className="range-label"><span>이미지 확대<b>{design.imageScale}%</b></span><input type="range" min="20" max="300" value={design.imageScale} onChange={(event) => setDesign((current) => ({ ...current, imageScale: Number(event.target.value) }))} /></label><label className="range-label"><span>배경 흐림<b>{design.imageBlur}px</b></span><input type="range" min="0" max="30" value={design.imageBlur} onChange={(event) => setDesign((current) => ({ ...current, imageBlur: Number(event.target.value) }))} /></label></>}
          {(design.backgroundMode === "dot" || design.backgroundMode === "check") && <><div className="split-fields aligned-color-fields"><label>바탕색<input type="color" value={design.patternBaseColor} onChange={(event) => setDesign((current) => ({ ...current, patternBaseColor: event.target.value }))} /></label><label>{design.backgroundMode === "dot" ? "도트색" : "체크색"}<input type="color" value={design.patternColor} onChange={(event) => setDesign((current) => ({ ...current, patternColor: event.target.value }))} /></label></div><label className="range-label"><span>{design.backgroundMode === "dot" ? "도트 간격" : "체크 크기"}<b>{design.patternSize}px</b></span><input type="range" min="8" max={design.backgroundMode === "check" ? "200" : "400"} value={design.patternSize} onChange={(event) => setDesign((current) => ({ ...current, patternSize: Number(event.target.value) }))} /></label>{design.backgroundMode === "dot" && <label className="range-label"><span>도트 크기<b>{design.dotSize.toFixed(2)}px</b></span><input type="range" min="0.5" max="160" step="0.5" value={design.dotSize} onChange={(event) => setDesign((current) => ({ ...current, dotSize: Number(event.target.value) }))} /></label>}<label className="range-label"><span>무늬 진하기<b>{design.patternStrength}%</b></span><input type="range" min="1" max="80" value={design.patternStrength} onChange={(event) => setDesign((current) => ({ ...current, patternStrength: Number(event.target.value) }))} /></label></>}
          {design.backgroundMode === "radial" && <><label className="color-row">바탕색<input type="color" value={design.radialBaseColor} onChange={(event) => setDesign((current) => ({ ...current, radialBaseColor: event.target.value }))} /></label><div className="radial-glow-heading"><span>빛번짐 요소</span><button onClick={() => setDesign((current) => ({ ...current, radialGlows: [...current.radialGlows, { id: makeId("glow"), shape: "circle", color: "#6694ea", x: clamp(50 + current.radialGlows.length * 8, 0, 100), y: clamp(50 + current.radialGlows.length * 6, 0, 100), size: 48, blur: 12 }] }))}>＋ 빛번짐 추가</button></div><p className="helper-note">모양을 고른 뒤 색, 위치, 크기와 흐림을 조정하세요. 빛번짐을 더 추가하면 여러 모양을 겹쳐 꾸밀 수 있습니다.</p><div className="radial-glow-list">{design.radialGlows.map((glow, index) => <div className="radial-glow-card" key={glow.id}><div className="radial-glow-card-heading"><b>빛번짐 {index + 1}</b><button disabled={design.radialGlows.length === 1} onClick={() => setDesign((current) => ({ ...current, radialGlows: current.radialGlows.filter((item) => item.id !== glow.id) }))}>삭제</button></div><span className="mini-label">모양</span><div className="ornament-visual-picker radial-shape-picker">{(["circle", "star", "clover", "heart", "flower", "sparkle"] as GlowShape[]).map((shape) => { const label = shape === "circle" ? "원형" : shape === "star" ? "별" : shape === "clover" ? "네잎클로버" : shape === "heart" ? "하트" : shape === "sparkle" ? "반짝임" : "꽃"; return <button className={glow.shape === shape ? "is-selected" : ""} aria-label={label} title={label} onClick={() => setDesign((current) => ({ ...current, radialGlows: current.radialGlows.map((item) => item.id === glow.id ? { ...item, shape } : item) }))} key={shape}><GlowShapeSvg type={shape} /></button>; })}</div><label className="color-row">빛번짐 색<input type="color" value={glow.color} onChange={(event) => setDesign((current) => ({ ...current, radialGlows: current.radialGlows.map((item) => item.id === glow.id ? { ...item, color: event.target.value } : item) }))} /></label><div className="split-fields"><label>가로 위치<input type="number" min="0" max="100" value={glow.x} onChange={(event) => setDesign((current) => ({ ...current, radialGlows: current.radialGlows.map((item) => item.id === glow.id ? { ...item, x: clamp(Number(event.target.value), 0, 100) } : item) }))} /></label><label>세로 위치<input type="number" min="0" max="100" value={glow.y} onChange={(event) => setDesign((current) => ({ ...current, radialGlows: current.radialGlows.map((item) => item.id === glow.id ? { ...item, y: clamp(Number(event.target.value), 0, 100) } : item) }))} /></label></div><label className="range-label"><span>크기<b>{glow.size}%</b></span><input type="range" min="8" max="140" value={glow.size} onChange={(event) => setDesign((current) => ({ ...current, radialGlows: current.radialGlows.map((item) => item.id === glow.id ? { ...item, size: Number(event.target.value) } : item) }))} /></label><label className="range-label"><span>흐림<b>{glow.blur}px</b></span><input type="range" min="0" max="40" value={glow.blur} onChange={(event) => setDesign((current) => ({ ...current, radialGlows: current.radialGlows.map((item) => item.id === glow.id ? { ...item, blur: Number(event.target.value) } : item) }))} /></label></div>)}</div></>}
        </div>
        <div className="control-card typography-card">
          <span className="field-label">내장 웹글꼴</span>
          <div className="font-list font-list-unified">{orderedFonts.map((font) => <button className={design.fontId === font.id ? "is-selected" : ""} style={{ fontFamily: font.family }} onClick={() => setDesign((current) => ({ ...current, fontId: font.id }))} key={font.id}>{font.label}</button>)}</div>
          <label>본문 굵기<select value={design.fontWeight} onChange={(event) => setDesign((current) => ({ ...current, fontWeight: Number(event.target.value) }))}><option value="300">가는 글씨 · 300</option><option value="400">보통 · 400</option><option value="500">중간 · 500</option><option value="600">반굵게 · 600</option><option value="700">굵게 · 700</option><option value="800">아주 굵게 · 800</option></select></label><label>줄바꿈 방식<select value={design.wrapMode} onChange={(event) => setDesign((current) => ({ ...current, wrapMode: event.target.value as WrapMode }))}><option value="normal">자연스럽게</option><option value="keep-all">단어 단위 유지</option><option value="break-all">글자 단위 줄바꿈</option></select></label><span className="mini-label">가로 정렬</span><div className="four-way-control">{(["left", "center", "right", "justify"] as TextAlign[]).map((align) => <button className={design.textAlign === align ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, textAlign: align }))} key={align}>{align === "left" ? "왼쪽" : align === "center" ? "가운데" : align === "right" ? "오른쪽" : "양쪽"}</button>)}</div>{["classic", "bubble"].includes(layout.mode) && <><span className="mini-label">본문 세로 위치</span><div className="three-way-control">{(["top", "center", "bottom"] as VerticalAlign[]).map((align) => <button className={design.verticalAlign === align ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, verticalAlign: align }))} key={align}>{align === "top" ? "위" : align === "center" ? "가운데" : "아래"}</button>)}</div></>}
        </div>
        <div className="control-card range-card">
          {design.backgroundMode === "image" && <><label><span>이미지 위 색상 막<b>{design.overlayOpacity}%</b></span><input type="range" min="0" max="96" value={design.overlayOpacity} onChange={(event) => setDesign((current) => ({ ...current, overlayOpacity: Number(event.target.value) }))} /></label><label className="color-row">막 색상<input type="color" value={design.overlayColor} onChange={(event) => setDesign((current) => ({ ...current, overlayColor: event.target.value }))} /></label></>}
          <label><span>글자 크기<b>{design.fontSize}px</b></span><input type="range" min="8" max="96" value={design.fontSize} onChange={(event) => setDesign((current) => ({ ...current, fontSize: Number(event.target.value) }))} /></label>
          <label><span>줄 간격<b>{design.lineHeight.toFixed(1)}</b></span><input type="range" min="1.2" max="2.4" step="0.1" value={design.lineHeight} onChange={(event) => setDesign((current) => ({ ...current, lineHeight: Number(event.target.value) }))} /></label>
          <label><span>자간<b>{design.letterSpacing.toFixed(2)}em</b></span><input type="range" min="-0.08" max="0.24" step="0.01" value={design.letterSpacing} onChange={(event) => setDesign((current) => ({ ...current, letterSpacing: Number(event.target.value) }))} /></label>
          <label><span>문단 간격<b>{design.paragraphSpacing.toFixed(1)}em</b></span><input type="range" min="0" max="4" step="0.1" value={design.paragraphSpacing} onChange={(event) => setDesign((current) => ({ ...current, paragraphSpacing: Number(event.target.value) }))} /></label>
          <label><span>글자 가로 비율<b>{design.textScaleX}%</b></span><input type="range" min="60" max="160" value={design.textScaleX} onChange={(event) => setDesign((current) => ({ ...current, textScaleX: Number(event.target.value) }))} /></label>
          <label>본문 단 수<input type="number" min="1" max="4" value={design.textColumns} onChange={(event) => setDesign((current) => ({ ...current, textColumns: clamp(Math.round(Number(event.target.value) || 1), 1, 4) }))} /></label>{design.textColumns > 1 && <label><span>단 사이 간격<b>{design.columnGap}px</b></span><input type="range" min="0" max="160" value={design.columnGap} onChange={(event) => setDesign((current) => ({ ...current, columnGap: Number(event.target.value) }))} /></label>}
          <label className="check-control wide-check"><input type="checkbox" checked={design.textShadowEnabled} onChange={(event) => setDesign((current) => ({ ...current, textShadowEnabled: event.target.checked }))} />글자 그림자</label>{design.textShadowEnabled && <div className="split-fields"><label className="color-control">그림자색<input type="color" value={design.textShadowColor} onChange={(event) => setDesign((current) => ({ ...current, textShadowColor: event.target.value }))} /></label><label>흐림 · px<input type="number" min="0" max="30" value={design.textShadowBlur} onChange={(event) => setDesign((current) => ({ ...current, textShadowBlur: clamp(Number(event.target.value), 0, 30) }))} /></label></div>}
          {design.fontSize <= 12 && <p className={`font-size-note ${design.fontId === "pretendard" && design.fontSize === 12 ? "is-stable" : ""}`}>{design.fontId === "pretendard"
            ? design.fontSize === 12
              ? "프리텐다드 12px는 고해상도 저장에서 안정적으로 사용할 수 있습니다."
              : "프리텐다드는 작은 크기에서도 비교적 선명하지만, 11px 이하는 2× 또는 3× 저장으로 확인하세요."
            : "12px 이하에서는 서체 획이 흐려질 수 있으니 2× 또는 3× 저장으로 먼저 확인하세요."}</p>}
        </div>
        <div className="control-card"><div className="history-heading"><span className="field-label">본문 여백 · px</span><label className="inline-check"><input type="checkbox" checked={design.paddingLinked} onChange={(event) => setDesign((current) => ({ ...current, paddingLinked: event.target.checked }))} />네 방향 연결</label></div><div className="padding-grid">
          <label>위<input type="number" min="0" max="600" value={design.paddingTop} onChange={(event) => updatePadding("paddingTop", Number(event.target.value))} /></label>
          <label>오른쪽<input type="number" min="0" max="600" value={design.paddingRight} onChange={(event) => updatePadding("paddingRight", Number(event.target.value))} /></label>
          <label>아래<input type="number" min="0" max="600" value={design.paddingBottom} onChange={(event) => updatePadding("paddingBottom", Number(event.target.value))} /></label>
          <label>왼쪽<input type="number" min="0" max="600" value={design.paddingLeft} onChange={(event) => updatePadding("paddingLeft", Number(event.target.value))} /></label>
        </div></div>
        <div className="control-card page-display-card">
          <div className="history-heading"><span className="field-label">페이지 표시</span><small>현재 {currentPage + 1}페이지</small></div>
          {["classic", "bubble"].includes(layout.mode) && <>
            <label className="check-control wide-check"><input type="checkbox" checked={design.showHeader} onChange={(event) => setDesign((current) => ({ ...current, showHeader: event.target.checked }))} />제목 표시</label>
            {design.showHeader && <label>제목 위 작은 문구<input value={layout.headerKicker} onChange={(event) => setLayout((current) => ({ ...current, headerKicker: event.target.value }))} placeholder="비우면 숨김" /></label>}
          </>}
          <label className="check-control wide-check"><input type="checkbox" checked={design.showPageNumber} onChange={(event) => setDesign((current) => ({ ...current, showPageNumber: event.target.checked }))} />페이지 번호 표시</label>
          {["classic", "bubble"].includes(layout.mode) && <label>전체 페이지 기본 제목<input value={layout.pageTitle} onChange={(event) => setLayout((current) => ({ ...current, pageTitle: event.target.value }))} placeholder={projectTitle || "제목 없는 발췌"} /></label>}
          {design.showPageNumber && <>
            <span className="mini-label">번호 표시 방식</span>
            <div className="page-number-presets">{pageNumberPatternPresets.map((preset) => <button className={layout.pageNumberPattern === preset.pattern ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, pageNumberPattern: preset.pattern }))} key={preset.id}><b>{formatPageNumberPattern(preset.pattern, currentPage + 1, displayPages.length)}</b><small>{preset.label}</small></button>)}</div>
            <div className="page-number-preview"><span>현재 표시 예시</span><b>{formatPageNumberPattern(layout.pageNumberPattern, currentPage + 1, displayPages.length)}</b></div>
            {pageNumberPatternPresets.every((preset) => preset.pattern !== layout.pageNumberPattern) ? <><label>직접 만든 형식<input value={layout.pageNumberPattern} onChange={(event) => setLayout((current) => ({ ...current, pageNumberPattern: event.target.value }))} placeholder="예: {current}쪽" /></label><dl className="page-number-token-help" aria-label="직접 형식 입력값 안내"><div><dt><code>{'{current}'}</code></dt><dd>현재 번호</dd></div><div><dt><code>{'{total}'}</code></dt><dd>전체 페이지 수</dd></div></dl></> : <details className="page-number-custom"><summary>직접 형식 만들기</summary><label>형식 입력<input value={layout.pageNumberPattern} onChange={(event) => setLayout((current) => ({ ...current, pageNumberPattern: event.target.value }))} placeholder="예: {current}쪽" /></label><dl className="page-number-token-help" aria-label="직접 형식 입력값 안내"><div><dt><code>{'{current}'}</code></dt><dd>현재 번호</dd></div><div><dt><code>{'{total}'}</code></dt><dd>전체 페이지 수</dd></div></dl></details>}
          </>}
          <div className="current-page-display"><b>이 페이지만 다르게 표시</b><p>비워 두면 위에서 정한 제목과 번호 표시 방식을 사용합니다.</p>{["classic", "bubble"].includes(layout.mode) && <label>이 페이지 제목<input value={layout.pageTitleOverrides[visiblePage.id] || ""} onChange={(event) => updateCurrentPageDisplay("title", event.target.value)} placeholder={layout.pageTitle || projectTitle || "기본 제목 사용"} /></label>}<label>이 페이지 번호 문구<input value={layout.pageNumberOverrides[visiblePage.id] || ""} onChange={(event) => updateCurrentPageDisplay("number", event.target.value)} placeholder={formatPageNumberPattern(layout.pageNumberPattern, currentPage + 1, displayPages.length)} /></label><button className="secondary-button full-button" onClick={() => setLayout((current) => { const titles = { ...current.pageTitleOverrides }; const numbers = { ...current.pageNumberOverrides }; delete titles[visiblePage.id]; delete numbers[visiblePage.id]; return { ...current, pageTitleOverrides: titles, pageNumberOverrides: numbers }; })}>이 페이지 설정 초기화</button></div>
        </div>
        <div className="control-card"><span className="field-label">내 디자인 보관함</span><p>같은 브라우저에서는 사이트를 닫아도 유지됩니다. 브라우저 데이터를 지우거나 다른 기기를 사용하면 공유되지 않습니다.</p><div className="joined-input"><input value={designName} onChange={(event) => setDesignName(event.target.value)} placeholder="디자인 이름" /><button onClick={saveDesign}>저장</button></div><div className="saved-design-list">{savedDesigns.map((item) => <div key={item.id}><button onClick={() => setDesign(normalizeDesign(item.design))}>{item.name}<small>{fontOptions.find((font) => font.id === item.design.fontId)?.label}</small></button><button aria-label={`${item.name} 삭제`} onClick={() => deleteDesign(item.id)}>×</button></div>)}</div></div>
      </div>;
    }

    if (activeTool === "layout") return <div className="tool-content">
      <div className="section-heading"><span className="eyebrow">STEP 02 · TEMPLATE</span><h2>템플릿 선택</h2><p>가져온 내용에 적용할 발췌 형식을 먼저 고릅니다. 세부 디자인은 뒤 단계에서 조정할 수 있습니다.</p></div>
      <div className="template-gallery">{layoutTemplates.map((template) => <button className={layout.mode === template.id ? "is-selected" : ""} aria-pressed={layout.mode === template.id} onClick={() => selectLayoutMode(template.id)} key={template.id}><span className={`template-thumbnail thumbnail-${template.id}`} aria-hidden="true"><i /><i /><i /></span><b>{template.label}</b><small>{template.description}</small></button>)}</div>
      {renderOutputSizeControl()}
      {layout.mode === "classic" && <><div className="control-card"><span className="field-label">페이지 구성</span><label className="check-control wide-check"><input type="checkbox" checked={layout.bookFeaturesEnabled} onChange={(event) => setLayout((current) => ({ ...current, bookFeaturesEnabled: event.target.checked }))} />책 페이지 기능 사용</label>{layout.bookFeaturesEnabled && <><div className="two-way-control"><button className={layout.bookView === "single" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, bookView: "single" }))}>한 페이지</button><button className={layout.bookView === "spread" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, bookView: "spread" }))}>양면 펼침</button></div><label className="check-control wide-check"><input type="checkbox" checked={layout.showCover} onChange={(event) => setLayout((current) => ({ ...current, showCover: event.target.checked }))} />표지 페이지 추가</label><label className="check-control wide-check"><input type="checkbox" checked={layout.paragraphIndent} onChange={(event) => setLayout((current) => ({ ...current, paragraphIndent: event.target.checked }))} />문단 첫 줄 들여쓰기</label></>}</div>{layout.bookFeaturesEnabled && <div className="control-card"><label>책 제목<input value={layout.bookTitle} onChange={(event) => setLayout((current) => ({ ...current, bookTitle: event.target.value }))} placeholder={projectTitle} /></label><label>부제<input value={layout.bookSubtitle} onChange={(event) => setLayout((current) => ({ ...current, bookSubtitle: event.target.value }))} /></label><label>저자<input value={layout.bookAuthor} onChange={(event) => setLayout((current) => ({ ...current, bookAuthor: event.target.value }))} /></label><label>장 제목<input value={layout.chapterTitle} onChange={(event) => setLayout((current) => ({ ...current, chapterTitle: event.target.value }))} /></label><label>러닝 헤더<input value={layout.runningHeader} onChange={(event) => setLayout((current) => ({ ...current, runningHeader: event.target.value }))} /></label></div>}</>}
      {layout.mode === "manuscript" && <div className="control-card layout-copy-card">
        <span className="field-label">원고지 양식</span>
        <span className="mini-label">작성 방식</span>
        <div className="two-way-control">
          <button className={layout.manuscriptMode === "horizontal" ? "is-selected" : ""} onClick={() => applyManuscriptTemplate("horizontal")}>가로쓰기</button>
          <button className={layout.manuscriptMode === "vertical" ? "is-selected" : ""} onClick={() => applyManuscriptTemplate("vertical")}>세로쓰기</button>
        </div>
        <span className="mini-label">진행 방향</span>
        <div className="two-way-control"><button className={layout.manuscriptDirection === "ltr" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, manuscriptDirection: "ltr" }))}>왼쪽 → 오른쪽</button><button className={layout.manuscriptDirection === "rtl" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, manuscriptDirection: "rtl" }))}>오른쪽 → 왼쪽</button></div>
        <div className="split-fields manuscript-dimension-fields"><label>한 줄 칸 수<input type="number" min="4" max="60" value={design.manuscriptColumns} onChange={(event) => setDesign((current) => ({ ...current, manuscriptColumns: clamp(Number(event.target.value), 4, 60) }))} /></label><label>줄 수<input type="number" min="2" max="40" value={design.manuscriptRows} onChange={(event) => setDesign((current) => ({ ...current, manuscriptRows: clamp(Number(event.target.value), 2, 40) }))} /></label></div>
        <span className="mini-label">원고지 칸 위치</span>
        <label className="range-label"><span>가로 위치<b>{layout.manuscriptGridX}%</b></span><input type="range" min="0" max="100" value={layout.manuscriptGridX} onChange={(event) => setLayout((current) => ({ ...current, manuscriptGridX: Number(event.target.value) }))} /></label>
        <label className="range-label"><span>세로 위치<b>{layout.manuscriptGridY}%</b></span><input type="range" min="0" max="100" value={layout.manuscriptGridY} onChange={(event) => setLayout((current) => ({ ...current, manuscriptGridY: Number(event.target.value) }))} /></label>
        <label className="range-label"><span>칸 영역 너비<b>{layout.manuscriptGridWidth}%</b></span><input type="range" min="30" max="96" value={layout.manuscriptGridWidth} onChange={(event) => setLayout((current) => ({ ...current, manuscriptGridWidth: Number(event.target.value) }))} /></label>
        <p className="helper-note">글자 크기는 그대로 유지하고 원고지 칸 영역을 확대·축소합니다. 정사각형 칸 비율에 맞춰 영역 높이도 함께 조정됩니다.</p>
        <div className="split-fields aligned-color-fields"><label>종이색<input type="color" value={design.paperColor} onChange={(event) => setDesign((current) => ({ ...current, paperColor: event.target.value }))} /></label><label>괘선색<input type="color" value={layout.manuscriptGridColor} onChange={(event) => setLayout((current) => ({ ...current, manuscriptGridColor: event.target.value }))} /></label></div>
        <div className="messenger-options"><label><input type="checkbox" checked={layout.manuscriptShowHeader} onChange={(event) => setLayout((current) => ({ ...current, manuscriptShowHeader: event.target.checked }))} />제목란</label><label><input type="checkbox" checked={layout.manuscriptShowPageNumber} onChange={(event) => setLayout((current) => ({ ...current, manuscriptShowPageNumber: event.target.checked }))} />매수</label><label><input type="checkbox" checked={layout.manuscriptShowFooter} onChange={(event) => setLayout((current) => ({ ...current, manuscriptShowFooter: event.target.checked }))} />꼬리말</label></div>
        {layout.manuscriptShowHeader && <><label>원고 제목<input value={layout.manuscriptTitle} onChange={(event) => setLayout((current) => ({ ...current, manuscriptTitle: event.target.value }))} placeholder={projectTitle} /></label><div className="split-fields"><label>제목 항목명<input value={layout.manuscriptTitleLabel} onChange={(event) => setLayout((current) => ({ ...current, manuscriptTitleLabel: event.target.value }))} /></label>{layout.manuscriptShowPageNumber && <label>매수 항목명<input value={layout.manuscriptSheetLabel} onChange={(event) => setLayout((current) => ({ ...current, manuscriptSheetLabel: event.target.value }))} /></label>}</div></>}
        {layout.manuscriptShowFooter && <><label>왼쪽 하단 문구<input value={layout.manuscriptFooterLeft} onChange={(event) => setLayout((current) => ({ ...current, manuscriptFooterLeft: event.target.value }))} /></label><label>오른쪽 하단 문구<input value={layout.manuscriptFooterRight} onChange={(event) => setLayout((current) => ({ ...current, manuscriptFooterRight: event.target.value }))} /></label></>}
      </div>}
      {layout.mode === "notebook" && <div className="control-card layout-copy-card"><span className="field-label">노트 구성과 문구</span><label>내지 종류<select value={layout.notebookPattern} onChange={(event) => setLayout((current) => ({ ...current, notebookPattern: event.target.value as NotebookPattern }))}><option value="line">유선 노트</option><option value="grid">방안 노트</option><option value="dot">도트 노트</option></select></label><p className="helper-note">가장 위의 좁은 줄은 비워 두고, 본문은 두 번째 줄부터 시작합니다.</p><label>날짜<input value={layout.notebookDate} onChange={(event) => setLayout((current) => ({ ...current, notebookDate: event.target.value }))} placeholder="2026. 07. 22" /></label><label>분류·쪽 정보<input value={layout.notebookMeta} onChange={(event) => setLayout((current) => ({ ...current, notebookMeta: event.target.value }))} placeholder="NOTE · 01" /></label></div>}
      {layout.mode === "microfilm" && <div className="control-card layout-copy-card"><span className="field-label">마이크로필름 구성</span><p className="helper-note">가로 결과물은 필름 프레임, 긴 배너는 필름 스트립을 선택하세요. 테두리와 필름 구멍도 선택한 규격에 맞춰 함께 조정됩니다.</p><div className="two-way-control"><button className={design.surfaceSize === "standard" ? "is-selected" : ""} onClick={() => applyMicrofilmPreset("standard")}>필름 프레임 · 960×540</button><button className={design.surfaceSize === "banner" ? "is-selected" : ""} onClick={() => applyMicrofilmPreset("banner")}>필름 스트립 · 1200×400</button></div><span className="mini-label">본문 세로 정렬</span><div className="three-way-control">{(["top", "center", "bottom"] as MicrofilmBodyAlign[]).map((align) => <button className={layout.microfilmBodyAlign === align ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, microfilmBodyAlign: align }))} key={align}>{align === "top" ? "위" : align === "center" ? "가운데" : "아래"}</button>)}</div><div className="fixed-size-notice"><b>{selectedOutputSize.label}</b><span>{selectedOutputSize.width} × {selectedOutputSize.height}px</span></div><label>컬렉션 이름<input value={layout.microfilmCollection} onChange={(event) => setLayout((current) => ({ ...current, microfilmCollection: event.target.value }))} /></label><div className="split-fields"><label>프레임 표기<input value={layout.microfilmFrame} onChange={(event) => setLayout((current) => ({ ...current, microfilmFrame: event.target.value }))} /></label><label>기록 날짜<input value={layout.microfilmDate} onChange={(event) => setLayout((current) => ({ ...current, microfilmDate: event.target.value }))} /></label></div><label>캡션<input value={layout.microfilmCaption} onChange={(event) => setLayout((current) => ({ ...current, microfilmCaption: event.target.value }))} /></label></div>}
      {layout.mode === "document" && <div className="control-card layout-copy-card">
        <span className="field-label">오피스 화면</span>
        <div className="two-way-control"><button className={layout.documentView === "print" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, documentView: "print" }))}>편집 페이지</button><button className={layout.documentView === "editor" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, documentView: "editor" }))}>오피스 문서</button></div>
        <label>파일 이름<input value={layout.documentFileName} onChange={(event) => setLayout((current) => ({ ...current, documentFileName: event.target.value }))} placeholder="새 문서 1" /></label>
        {layout.documentView === "editor" && <label className="check-control wide-check"><input type="checkbox" checked={layout.documentShowRulers} onChange={(event) => setLayout((current) => ({ ...current, documentShowRulers: event.target.checked }))} />가로·세로 눈금자</label>}
        <label className="check-control wide-check"><input type="checkbox" checked={layout.documentShowHeader} onChange={(event) => setLayout((current) => ({ ...current, documentShowHeader: event.target.checked }))} />문서 머리말</label>
        {layout.documentShowHeader && <label>머리말<input value={layout.documentHeader} onChange={(event) => setLayout((current) => ({ ...current, documentHeader: event.target.value }))} /></label>}
        <label className="check-control wide-check"><input type="checkbox" checked={layout.documentShowFooter} onChange={(event) => setLayout((current) => ({ ...current, documentShowFooter: event.target.checked }))} />꼬리말·쪽 번호</label>
        {layout.documentShowFooter && <label>꼬리말<input value={layout.documentFooter} onChange={(event) => setLayout((current) => ({ ...current, documentFooter: event.target.value }))} placeholder="선택 입력" /></label>}
      </div>}
      {layout.mode === "webcore" && <div className="control-card layout-copy-card">
        <span className="field-label">웹코어 · 메모장</span>
        <p className="helper-note">90년대 창 UI를 바탕으로 제목, 메뉴, 스크롤바 문구를 구성합니다.</p>
        <label>창 제목<input value={layout.webcoreTitle} onChange={(event) => setLayout((current) => ({ ...current, webcoreTitle: event.target.value }))} /></label>
        <label>파일 이름<input value={layout.webcoreFileName} onChange={(event) => setLayout((current) => ({ ...current, webcoreFileName: event.target.value }))} /></label>
        <label>메뉴 문구<input value={layout.webcoreMenu} onChange={(event) => setLayout((current) => ({ ...current, webcoreMenu: event.target.value }))} /></label>
        <label className="check-control wide-check"><input type="checkbox" checked={layout.webcoreShowScrollbars} onChange={(event) => setLayout((current) => ({ ...current, webcoreShowScrollbars: event.target.checked }))} />고전 스크롤바 표시</label>
      </div>}
      {["bubble", "messenger"].includes(layout.mode) && <>
        {layout.mode === "messenger" && <div className="control-card messenger-screen-settings"><span className="field-label">메신저 화면</span><div className="two-way-control"><button className={layout.messengerStyle === "kakao" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, messengerStyle: "kakao" }))}>카카오톡</button><button className={layout.messengerStyle === "dm" ? "is-selected" : ""} onClick={() => setLayout((current) => ({ ...current, messengerStyle: "dm" }))}>DM</button></div><span className="mini-label">휴대폰 캡처 높이</span><div className="two-way-control"><button className={design.surfaceSize === "standard" ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, surfaceSize: "standard" }))}>540×960</button><button className={design.surfaceSize === "banner" ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, surfaceSize: "banner" }))}>540×1170</button></div>{layout.messengerStyle === "dm" && <label>DM 화면<select value={layout.dmTheme} onChange={(event) => setLayout((current) => ({ ...current, dmTheme: event.target.value as "light" | "dark" }))}><option value="light">라이트</option><option value="dark">다크</option></select></label>}<label>대화방 이름<input value={layout.chatTitle} onChange={(event) => setLayout((current) => ({ ...current, chatTitle: event.target.value }))} placeholder="대화" /></label><label>상태·참여자 정보<input value={layout.chatSubtitle} onChange={(event) => setLayout((current) => ({ ...current, chatSubtitle: event.target.value }))} placeholder="선택 입력" /></label><label>날짜 구분선<input value={layout.chatDate} onChange={(event) => setLayout((current) => ({ ...current, chatDate: event.target.value }))} placeholder="2026년 7월 21일 화요일" /></label><div className="split-fields"><label>상태바 시간<input type="time" value={layout.statusBarTime} onChange={(event) => setLayout((current) => ({ ...current, statusBarTime: event.target.value }))} /></label><label>입력창 문구<input value={layout.chatComposerText} onChange={(event) => setLayout((current) => ({ ...current, chatComposerText: event.target.value }))} /></label></div></div>}
        <div className="control-card">
          <div className="history-heading"><span className="field-label">화자와 방향</span><button className="speaker-add-button" onClick={addSpeaker}>＋ 화자 추가</button></div>
          {layout.speakers.map((speaker) => <div className="speaker-editor" key={speaker.id}>
            <div className="speaker-avatar-preview">{speaker.avatar ? <img src={speaker.avatar} alt="" /> : speaker.name.slice(0, 1)}</div>
            <div><input aria-label="화자 이름" value={speaker.name} onChange={(event) => updateSpeaker(speaker.id, { name: event.target.value })} /><div className={`speaker-options ${layout.mode !== "bubble" ? "direction-only" : ""}`}><select aria-label={`${speaker.name} 말풍선 방향`} value={speaker.side} onChange={(event) => updateSpeaker(speaker.id, { side: event.target.value as SpeakerSide })}><option value="left">왼쪽 말풍선</option><option value="right">오른쪽 말풍선</option></select>{layout.mode === "bubble" && <input aria-label={`${speaker.name} 말풍선 색`} title="말풍선 색" type="color" value={speaker.color} onChange={(event) => updateSpeaker(speaker.id, { color: event.target.value })} />}</div></div>
            <div className="speaker-editor-actions"><button onClick={() => { setAvatarTarget(speaker.id); avatarInputRef.current?.click(); }}>사진</button><button aria-label={`${speaker.name} 삭제`} onClick={() => removeSpeaker(speaker.id)}>삭제</button></div>
          </div>)}
          <input ref={avatarInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleAvatarFile} />
          <div className="messenger-options"><label><input type="checkbox" checked={layout.showAvatars} onChange={(event) => setLayout((current) => ({ ...current, showAvatars: event.target.checked }))} />프로필</label><label><input type="checkbox" checked={layout.compactAvatars} onChange={(event) => setLayout((current) => ({ ...current, compactAvatars: event.target.checked }))} />연속 프로필 생략</label><label><input type="checkbox" checked={layout.showTails} onChange={(event) => setLayout((current) => ({ ...current, showTails: event.target.checked }))} />말꼬리</label><label><input type="checkbox" checked={layout.showSpeakerNames} onChange={(event) => setLayout((current) => ({ ...current, showSpeakerNames: event.target.checked }))} />화자명</label><label><input type="checkbox" checked={layout.showTime} onChange={(event) => setLayout((current) => ({ ...current, showTime: event.target.checked }))} />시간 표시</label><label><input type="checkbox" checked={layout.showReadStatus} onChange={(event) => setLayout((current) => ({ ...current, showReadStatus: event.target.checked }))} />읽음 표시</label></div>
          <div className="bubble-detail-grid"><label>최대 너비 · %<input type="number" min="35" max="92" value={layout.bubbleMaxWidth} onChange={(event) => setLayout((current) => ({ ...current, bubbleMaxWidth: clamp(Number(event.target.value), 35, 92) }))} /></label><label>모서리 · px<input type="number" min="0" max="36" value={layout.bubbleRadius} onChange={(event) => setLayout((current) => ({ ...current, bubbleRadius: clamp(Number(event.target.value), 0, 36) }))} /></label><label>가로 안쪽 · px<input type="number" min="4" max="30" value={layout.bubblePaddingX} onChange={(event) => setLayout((current) => ({ ...current, bubblePaddingX: clamp(Number(event.target.value), 4, 30) }))} /></label><label>세로 안쪽 · px<input type="number" min="3" max="24" value={layout.bubblePaddingY} onChange={(event) => setLayout((current) => ({ ...current, bubblePaddingY: clamp(Number(event.target.value), 3, 24) }))} /></label><label>메시지 간격 · px<input type="number" min="0" max="36" value={layout.messageGap} onChange={(event) => setLayout((current) => ({ ...current, messageGap: clamp(Number(event.target.value), 0, 36) }))} /></label></div>
        </div>
        {visiblePage && !visiblePage.cover && <div className="control-card"><div className="history-heading"><span className="field-label">현재 페이지 화자 지정</span><small>{visibleParagraphs.length}문단</small></div><div className="bulk-speakers">{layout.speakers.map((speaker) => <button onClick={() => {
          const next = { ...layout.assignments };
          visibleParagraphs.forEach((paragraph, index) => { next[`${visiblePage.id}:${index}`] = speaker.id; next[`text:${visiblePage.startOffset + paragraph.start}`] = speaker.id; });
          setLayout((current) => ({ ...current, assignments: next }));
        }} key={speaker.id}>모두 {speaker.name}</button>)}<button onClick={() => {
          const next = { ...layout.assignments };
          visibleParagraphs.forEach((paragraph, index) => { delete next[`${visiblePage.id}:${index}`]; delete next[`text:${visiblePage.startOffset + paragraph.start}`]; });
          setLayout((current) => ({ ...current, assignments: next }));
        }}>모두 미지정</button></div><div className="paragraph-speakers">{visibleParagraphs.map((paragraph, index) => {
          const key = `${visiblePage.id}:${index}`;
          const globalKey = `text:${visiblePage.startOffset + paragraph.start}`;
          const assigned = layout.assignments[globalKey] || layout.assignments[key] || "";
          const meta = layout.messageMeta[key] || { time: "", readStatus: "" };
          return <div className="paragraph-speaker-item" key={key}><span>{paragraph.text.slice(0, 42)}{paragraph.text.length > 42 ? "…" : ""}</span><select aria-label={`문단 ${index + 1} 화자`} value={assigned} onChange={(event) => setLayout((current) => ({ ...current, assignments: { ...current.assignments, [key]: event.target.value, [globalKey]: event.target.value } }))}><option value="">미지정·서술</option>{layout.speakers.map((speaker) => <option value={speaker.id} key={speaker.id}>{speaker.name} · {speaker.side === "left" ? "왼쪽" : "오른쪽"}</option>)}</select>{assigned && (layout.showTime || layout.showReadStatus) && <div className="message-meta-editor">{layout.showTime && <label>시간<input type="time" value={meta.time} onChange={(event) => updateMessageMeta(key, { time: event.target.value })} /></label>}{layout.showReadStatus && <label>읽음<input value={meta.readStatus} maxLength={8} onChange={(event) => updateMessageMeta(key, { readStatus: event.target.value })} placeholder="1 또는 읽음" /></label>}</div>}</div>;
        })}</div></div>}
      </>}
    </div>;

    return <div className="tool-content">
      <div className="section-heading"><span className="eyebrow">STEP 05 · FINISH</span><h2>페이지 확인·저장</h2><p>페이지 순서와 분할을 확인한 뒤 텍스트, 프로젝트와 이미지를 저장합니다.</p></div>
      <div className="control-card finish-page-check"><div className="history-heading"><span className="field-label">최종 페이지 확인</span><small>{currentPage + 1} / {displayPages.length}</small></div><div className="finish-page-summary"><div><b>{displayPages.length}</b><span>전체 페이지</span></div><div><b>{charCount.toLocaleString()}</b><span>수정본 글자</span></div><div><b>{draft.match(/\f/g)?.length || 0}</b><span>수동 경계</span></div></div><div className="three-way-control"><button disabled={currentPage <= 0} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}>← 이전</button><button onClick={() => setInspectorTab("pages")}>페이지 목록</button><button disabled={currentPage >= displayPages.length - 1} onClick={() => setCurrentPage((page) => Math.min(displayPages.length - 1, page + 1))}>다음 →</button></div></div>
      <div className="export-list"><button onClick={() => downloadFile(`${projectTitle || "wesea-archive"}.txt`, draft, "text/plain;charset=utf-8")}><span className="export-icon">TXT</span><span><b>텍스트 저장</b><small>수정본 일반 텍스트</small></span><i>↗</i></button><button onClick={exportProject}><span className="export-icon">JSON</span><span><b>프로젝트 파일</b><small>규칙·디자인·레이아웃 포함</small></span><i>↗</i></button></div>
      <div className="control-card"><span className="field-label">이미지 화질</span><div className="two-way-control"><button className={design.exportScale === 2 ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, exportScale: 2 }))}>선명 · 2×</button><button className={design.exportScale === 3 ? "is-selected" : ""} onClick={() => setDesign((current) => ({ ...current, exportScale: 3 }))}>초고화질 · 3×</button></div><div className="fixed-size-notice"><b>{selectedOutputSize.label}</b><span>{selectedOutputSize.width * design.exportScale} × {selectedOutputSize.height * design.exportScale}px</span></div><p className="helper-note">2×부터 글꼴 가장자리를 고해상도로 렌더링합니다. 3×는 파일 용량과 생성 시간이 더 큽니다.</p></div>
      <div className="control-card"><span className="field-label">현재 페이지 이미지</span><div className="format-export-row"><button disabled={exporting} onClick={() => exportCurrentImage("png")}>PNG</button><button disabled={exporting} onClick={() => exportCurrentImage("jpeg")}>JPEG</button><button disabled={exporting} onClick={() => exportCurrentImage("webp")}>WebP</button><button disabled={exporting} onClick={copyCurrentImage}>복사</button></div></div>
      <div className="export-list"><button disabled={exporting} onClick={exportAllZip}><span className="export-icon">ZIP</span><span><b>전체 페이지 ZIP</b><small>{displayPages.length}개 PNG 묶음</small></span><i>↗</i></button><button disabled={exporting} onClick={exportLongImage}><span className="export-icon">LONG</span><span><b>긴 이미지</b><small>모든 페이지 세로 연결</small></span><i>↗</i></button></div>
      <div className="control-card compact-card"><span className="field-label">내보내기 전 확인</span><p>{mosaicTerms.length ? `모자이크 단어 ${mosaicTerms.length}개가 포함되어 있습니다.` : "현재 모자이크 처리된 단어가 없습니다."} 선택한 웹글꼴 로딩이 끝난 뒤 이미지를 만듭니다.</p></div>
    </div>;
  }

  return <main className={`quote-studio mobile-${mobileView} ${leftCollapsed ? "left-is-collapsed" : ""} ${rightCollapsed ? "right-is-collapsed" : ""}`} style={rootStyle}>
    <header className="app-header">
      <div className="brand-block"><div className="brand-mark"><img src={publicAsset("/brand/wesea-symbol-deploy.png")} alt="" aria-hidden="true" /></div><div><h1>{APP_NAME}</h1><span>{APP_TAGLINE}</span></div></div>
      <div className="project-heading"><input aria-label="프로젝트 제목" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} /><span>{dirty ? "변경 저장 중…" : savedAt ? `${savedAt} 자동 저장됨` : "자동 저장 준비됨"}</span></div>
      <div className="header-actions project-actions"><div className="history-actions"><button disabled={!canUndo} aria-label="실행 취소" title="실행 취소 · Ctrl/⌘ Z" onClick={undoProject}>↶</button><button disabled={!canRedo} aria-label="다시 실행" title="다시 실행 · Ctrl/⌘ Shift Z" onClick={redoProject}>↷</button></div><div className="project-menu-wrap"><button className="ghost-button" onClick={() => setProjectMenuOpen((value) => !value)}>프로젝트 ▾</button>{projectMenuOpen && <div className="project-menu"><div className="project-menu-head"><b>프로젝트</b><button onClick={createNewProject}>+ 새로 만들기</button></div><div className="project-menu-list">{projects.map((project) => <div className={`project-menu-item ${project.id === projectId ? "is-current" : ""}`} key={project.id}><button className="project-select-button" onClick={() => switchProject(project)}><b>{project.title || "제목 없는 발췌"}</b><small>{project.draft.length.toLocaleString()}자 · {new Date(project.updatedAt).toLocaleDateString("ko-KR")}</small></button><button className="project-delete-button" aria-label={`${project.title || "제목 없는 발췌"} 프로젝트 삭제`} onClick={() => deleteProject(project)}>×</button></div>)}</div><button className="project-file-button" onClick={() => fileInputRef.current?.click()}>파일에서 불러오기</button></div>}</div><button className="primary-button save-button" onClick={() => persistNow(true)}>지금 저장</button><button className="icon-button" aria-label="환경 설정" onClick={() => setSettingsOpen(true)}>⚙</button></div>
    </header>
    <nav className="mobile-tabs" aria-label="모바일 화면 전환"><button className={mobileView === "tools" ? "is-active" : ""} onClick={() => setMobileView("tools")}>발췌 순서</button><button className={mobileView === "editor" ? "is-active" : ""} onClick={() => setMobileView("editor")}>캔버스</button><button className={mobileView === "reference" ? "is-active" : ""} onClick={() => setMobileView("reference")}>텍스트·페이지</button></nav>
    <div className="workspace-grid">
      <aside className="left-panel panel-shell">
        <nav className="tool-rail workflow-rail" aria-label="발췌 작업 순서">
          <div className="workflow-rail-heading"><b>발췌 순서</b><small>STEP 1–5</small></div>
          {toolItems.map((tool, index) => { const selected = tool.tools.includes(activeTool); return <button className={`workflow-step-button ${selected ? "is-active" : ""}`} aria-label={`${index + 1}단계 ${tool.label}`} aria-current={selected ? "step" : undefined} title={tool.description} data-last={index === toolItems.length - 1} onClick={() => { setActiveTool(tool.primaryTool); setLeftCollapsed(false); }} key={tool.id}><span className="workflow-step-index">{index + 1}</span><small>{tool.label}</small></button>; })}
          <button className="rail-collapse" aria-label={leftCollapsed ? "과정 패널 펼치기" : "과정 패널 접기"} onClick={() => setLeftCollapsed((value) => !value)}>{leftCollapsed ? "›" : "‹"}</button>
        </nav>
        <section ref={toolPanelRef} className="tool-panel">
          <div className="workflow-panel-bar"><div><span>STEP {String(activeToolIndex + 1).padStart(2, "0")} / {String(toolItems.length).padStart(2, "0")}</span><b>{activeToolItem.label}</b><small>{activeToolItem.description}</small></div><div className="workflow-panel-actions"><button disabled={activeToolIndex === 0} aria-label="이전 단계" onClick={() => setActiveTool(toolItems[Math.max(0, activeToolIndex - 1)].primaryTool)}>←</button><button disabled={activeToolIndex === toolItems.length - 1} onClick={() => setActiveTool(toolItems[Math.min(toolItems.length - 1, activeToolIndex + 1)].primaryTool)}>다음 →</button></div></div>
          {activeToolItem.id === "content" && <nav className="workflow-subtabs" aria-label="내용 정리 도구">{contentToolItems.map((item) => <button className={activeTool === item.id ? "is-active" : ""} onClick={() => setActiveTool(item.id)} key={item.id}>{item.label}</button>)}</nav>}
          {renderToolPanel()}
        </section>
        <div className="left-panel-resizer" role="separator" aria-label="설정 패널 폭 조절" aria-orientation="vertical" aria-valuemin={MIN_LEFT_PANEL_WIDTH} aria-valuemax={MAX_LEFT_PANEL_WIDTH} aria-valuenow={leftPanelWidth} tabIndex={0} title="드래그하여 폭 조절 · 더블클릭하여 기본 폭" onPointerDown={startLeftPanelResize} onPointerMove={moveLeftPanelResize} onPointerUp={endLeftPanelResize} onPointerCancel={endLeftPanelResize} onDoubleClick={() => setLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH)} onKeyDown={(event) => { if (event.key === "ArrowLeft") setLeftPanelWidth((value) => clamp(value - 10, MIN_LEFT_PANEL_WIDTH, MAX_LEFT_PANEL_WIDTH)); if (event.key === "ArrowRight") setLeftPanelWidth((value) => clamp(value + 10, MIN_LEFT_PANEL_WIDTH, MAX_LEFT_PANEL_WIDTH)); if (event.key === "Home") setLeftPanelWidth(DEFAULT_LEFT_PANEL_WIDTH); }} />
      </aside>
      <section className="canvas-panel panel-shell">
        <div className="canvas-toolbar"><div><b>캔버스</b><span>{canvasLayoutLabels[layout.mode] || layout.mode.toUpperCase()} · {selectedOutputSize.width} × {selectedOutputSize.height}px</span></div><div className="canvas-toolbar-actions"><select aria-label="캔버스 맞춤 방식" value={canvasFitMode} onChange={(event) => { const mode = event.target.value as CanvasFitMode; if (mode === "custom") setCanvasFitMode(mode); else if (mode === "all") fitCanvas("all"); else if (mode === "width") fitCanvas("width"); else fitCanvas("height"); }}><option value="all">전체 맞춤</option><option value="width">너비 맞춤</option><option value="height">높이 맞춤</option><option value="custom">사용자 확대</option></select><button onClick={() => setCustomZoom(canvasZoom - 10)}>−</button><output>{canvasZoom}%</output><button onClick={() => setCustomZoom(canvasZoom + 10)}>＋</button><button onClick={() => setCustomZoom(100)}>100%</button></div></div>
        <div ref={canvasWorkbenchRef} className="canvas-workbench"><div className={`central-preview-stage ${layout.mode === "classic" && layout.bookFeaturesEnabled && layout.bookView === "spread" ? "is-spread" : ""}`} style={{ "--canvas-zoom": canvasZoom / 100, "--canvas-width": `${selectedOutputSize.width}px`, "--canvas-spread-width": `${selectedOutputSize.width * 2 + 2}px` } as CSSProperties}><PreviewPage page={visiblePage} pageNumber={currentPage + 1} totalPages={displayPages.length} title={projectTitle} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} design={design} layout={layout} scrapbookPage={visibleScrapbookState} scrapbookSelectedId={selectedScrapbookElementId} onScrapbookSelect={setSelectedScrapbookElementId} onScrapbookChange={updateScrapbookElement} />{layout.mode === "classic" && layout.bookFeaturesEnabled && layout.bookView === "spread" && displayPages[currentPage + 1] && <PreviewPage page={displayPages[currentPage + 1]} pageNumber={currentPage + 2} totalPages={displayPages.length} title={projectTitle} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} design={design} layout={layout} />}</div></div>
        <div className="canvas-statusbar"><div className="page-stepper"><button disabled={currentPage <= 0} onClick={() => setCurrentPage((value) => Math.max(0, value - (layout.mode === "classic" && layout.bookFeaturesEnabled && layout.bookView === "spread" ? 2 : 1)))}>←</button><span>페이지 {currentPage + 1} / {displayPages.length}</span><button disabled={currentPage >= displayPages.length - 1} onClick={() => setCurrentPage((value) => Math.min(displayPages.length - 1, value + (layout.mode === "classic" && layout.bookFeaturesEnabled && layout.bookView === "spread" ? 2 : 1)))}>→</button></div><div className="canvas-output-status">{canvasOverflow && <b>내용 넘침 · 페이지 분할 또는 여백 조정 필요</b>}<span>출력 {selectedOutputSize.width * design.exportScale} × {selectedOutputSize.height * design.exportScale}px · {design.exportScale}×</span></div></div>
      </section>
      <aside className="right-panel panel-shell"><button className="right-collapse" aria-label={rightCollapsed ? "텍스트 패널 펼치기" : "텍스트 패널 접기"} onClick={() => setRightCollapsed((value) => !value)}>{rightCollapsed ? "‹" : "›"}</button><div className="right-content inspector-content">
        <div className="inspector-tabs" role="tablist"><button className={inspectorTab === "draft" ? "is-selected" : ""} onClick={() => setInspectorTab("draft")}>수정본</button><button className={inspectorTab === "source" ? "is-selected" : ""} onClick={() => setInspectorTab("source")}>원문</button><button className={inspectorTab === "pages" ? "is-selected" : ""} onClick={() => setInspectorTab("pages")}>페이지</button></div>
        {inspectorTab === "draft" && <section className="inspector-pane draft-pane"><div className="inspector-heading"><div><small>EDITED COPY</small><b>수정본</b></div><span>{charCount.toLocaleString()}자</span></div><div className="editor-toolbar compact-editor-toolbar"><button onClick={() => setActiveTool("edit")}><b>선택 서식</b></button><button onClick={() => setActiveTool("rules")}>구문 규칙</button><button onClick={insertManualBreak}>페이지 나누기</button></div><div className={`main-editor-layer ${wordSearch ? "has-search" : ""}`}>{wordSearch && <div ref={editorHighlightRef} className="main-editor-highlight" aria-hidden="true"><HighlightedEditorText text={draft} term={wordSearch.trim()} excludedStarts={searchExcludedStarts} /></div>}<textarea ref={editorRef} className="main-editor" aria-label="수정본 편집기" value={draft} onChange={(event) => { commitDraft(event.target.value); setEditorSelection({ start: event.target.selectionStart, end: event.target.selectionEnd }); }} onScroll={(event) => { if (editorHighlightRef.current) { editorHighlightRef.current.scrollTop = event.currentTarget.scrollTop; editorHighlightRef.current.scrollLeft = event.currentTarget.scrollLeft; } }} onSelect={(event) => setEditorSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })} onKeyUp={(event) => setEditorSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })} onClick={(event) => setEditorSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })} spellCheck={false} /></div><div className="editor-footer"><span>원문과 별도 보존</span><span>{rules.length}개 규칙 · 직접 서식 {directMarks.length}개</span></div></section>}
        {inspectorTab === "source" && <section className="inspector-pane source-pane"><div className="inspector-heading"><div><small>ORIGINAL · {htmlCount ? `HTML ${htmlCount}` : "TEXT"}</small><b>원문</b></div></div><div className="source-view-tabs"><button className={sourceView === "raw" ? "is-selected" : ""} onClick={() => setSourceView("raw")}>원본 코드</button><button className={sourceView === "text" ? "is-selected" : ""} onClick={() => setSourceView("text")}>태그 제거 결과</button></div><div className="source-preview"><pre>{sourceView === "raw" ? source : stripHtml(source)}</pre></div></section>}
        {inspectorTab === "pages" && <section className="inspector-pane pages-pane"><div className="inspector-heading"><div><small>PAGE MANAGER</small><b>페이지</b></div><span>{displayPages.length}장</span></div><div className="page-list">{displayPages.map((page, index) => <button className={currentPage === index ? "is-selected" : ""} onClick={() => setCurrentPage(index)} key={page.id}><span>{index + 1}</span><div><b>{page.cover ? "표지" : `페이지 ${index + 1}`}</b><small>{page.text.replace(/\s+/g, " ").slice(0, 62) || "빈 페이지"}</small></div></button>)}</div></section>}
      </div></aside>
    </div>

    {projectMenuOpen && <button className="menu-dismiss" aria-label="프로젝트 메뉴 닫기" onClick={() => setProjectMenuOpen(false)} />}
    {pendingImport && <div className="modal-backdrop"><section className="settings-modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title"><div className="modal-header"><div><span className="eyebrow">IMPORT SAFETY</span><h2 id="import-title">가져오기 방식을 선택하세요</h2></div></div><p className="modal-lead"><b>{pendingImport.items.length}개 항목</b>을 가져오려 합니다. 현재 작업을 즉시 덮어쓰지 않습니다.</p><div className="import-choice-list"><button onClick={() => resolveImport("new")}><b>새 프로젝트로 열기</b><small>가장 안전함 · 파일마다 별도 프로젝트 생성</small></button><button onClick={() => resolveImport("append")}><b>현재 내용 뒤에 이어붙이기</b><small>원문과 수정본 끝에 순서대로 추가</small></button><button className="danger-choice" onClick={() => resolveImport("replace")}><b>현재 프로젝트 내용 교체</b><small>현재 원문과 수정본을 선택한 내용으로 바꿈</small></button></div><button className="secondary-button full-button" onClick={() => resolveImport("cancel")}>취소</button></section></div>}
    {settingsOpen && <div className="modal-backdrop" onMouseDown={() => setSettingsOpen(false)}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">INTERFACE</span><h2 id="settings-title">UI 안내</h2></div><button className="icon-button" aria-label="설정 닫기" onClick={() => setSettingsOpen(false)}>×</button></div><div className="control-card interface-note"><span className="interface-accent-swatch" /><div><b>{APP_NAME} Blue</b><p>파란색은 선택한 메뉴와 현재 설정을 표시합니다. 저장되는 결과물의 색상에는 영향을 주지 않습니다.</p></div></div><div className="font-license-note"><b>웹글꼴 안내</b><p>배포 가능한 글꼴 파일을 프로젝트에 포함했습니다. 네트워크 연결 없이도 미리보기와 이미지 저장에 같은 글꼴을 사용합니다.</p></div><button className="primary-button full-button" onClick={() => setSettingsOpen(false)}>확인</button></section></div>}

    <div className="export-render-area" style={{ width: `${selectedOutputSize.width}px` }} aria-hidden="true"><div ref={longExportRef} className="long-export-stack" style={{ width: `${selectedOutputSize.width}px` }}>{displayPages.map((page, index) => <div ref={(node) => { exportRefs.current[page.id] = node; }} key={page.id}><PreviewPage page={page} pageNumber={index + 1} totalPages={displayPages.length} title={projectTitle} rules={rules} mosaicTerms={mosaicTerms} directMarks={directMarks} flowBlocks={flowBlocks} paragraphMarks={paragraphMarks} design={design} layout={layout} scrapbookPage={getScrapbookPageState(scrapbookPages, page, layout.mode)} fixedSize /></div>)}</div></div>
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
