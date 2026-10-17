import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../package.json', import.meta.url));
function load(file, extra = '') {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8') + extra, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module: loadedModule, exports: loadedModule.exports, require: name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), process, console, URL, Date, setTimeout, clearTimeout });
  return loadedModule.exports;
}
const { defaultDesign, defaultLayout, normalizeLayout, getOutputSize, getMessengerChrome } = load(path.join(root, 'app/quote-studio.tsx'), '\nexport {defaultDesign,defaultLayout,normalizeLayout,getOutputSize,getMessengerChrome};');

test('new projects fit messenger content; older messenger projects retain phone dimensions', () => {
  assert.equal(defaultLayout.messengerSizing, 'content');
  assert.equal(normalizeLayout().messengerSizing, 'content');
  for (const mode of ['messenger', 'kakao', 'dm']) assert.equal(normalizeLayout({ mode }).messengerSizing, 'phone');
  const saved = normalizeLayout({ mode: 'messenger', messengerSizing: 'custom', messengerWidth: 720, messengerHeight: 1300, messengerShowHeader: false });
  const restored = normalizeLayout(JSON.parse(JSON.stringify(saved)));
  assert.equal(restored.messengerSizing, 'custom');
  assert.equal(restored.messengerWidth, 720);
  assert.equal(restored.messengerShowHeader, false);
});
test('phone sizes remain available in every messenger skin', () => {
  for (const messengerStyle of ['kakao', 'dm', 'imessage']) for (const surfaceSize of ['standard', 'banner']) {
    const size = getOutputSize({ ...defaultDesign, surfaceSize }, { ...defaultLayout, mode: 'messenger', messengerStyle, messengerSizing: 'phone' });
    assert.equal(size.width, 540);
    assert.equal(size.height, surfaceSize === 'banner' ? 1170 : 960);
  }
});
test('custom dimensions and content width do not depend on another template canvas', () => {
  const layout = { ...defaultLayout, mode: 'messenger', messengerSizing: 'custom', messengerWidth: 720, messengerHeight: 1280 };
  const size = getOutputSize({ ...defaultDesign, canvasWidth: 999, canvasHeight: 444 }, layout);
  assert.equal(size.width, 720);
  assert.equal(size.height, 1280);
  assert.equal(getOutputSize(defaultDesign, { ...layout, messengerSizing: 'content', rotateOutput: true }).width, 720);
});
test('malformed imported dimensions cannot produce an invalid canvas', () => {
  const layout = normalizeLayout({ mode: 'messenger', messengerSizing: 'custom', messengerWidth: 'no', messengerHeight: null });
  const size = getOutputSize(defaultDesign, layout);
  assert.equal(size.width, 540);
  assert.equal(size.height, 960);
});
test('chrome scales with width and hidden bars reserve no space', () => {
  for (const messengerStyle of ['kakao', 'dm', 'imessage']) {
    const layout = { ...defaultLayout, messengerStyle };
    const normal = getMessengerChrome(layout, 540), wide = getMessengerChrome(layout, 1080);
    for (const key of ['status', 'header', 'bottom']) assert.equal(wide[key], normal[key] * 2);
    const hidden = getMessengerChrome({ ...layout, messengerShowHeader: false, messengerShowComposer: false, messengerShowNavigation: false }, 540);
    assert.equal(hidden.status + hidden.header + hidden.bottom, 0);
    const composerOnly = getMessengerChrome({ ...layout, messengerShowNavigation: false }, 540);
    const navigationOnly = getMessengerChrome({ ...layout, messengerShowComposer: false }, 540);
    assert.ok(composerOnly.bottom > 0 && composerOnly.bottom < normal.bottom);
    assert.ok(navigationOnly.bottom > 0 && navigationOnly.bottom < normal.bottom);
  }
});
