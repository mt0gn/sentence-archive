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

const { renderToStaticMarkup } = require('react-dom/server');
const { defaultLayout, normalizeLayout, NotebookPreview, PreviewText, normalizeParagraphMarks } = load(path.join(root, 'app/quote-studio.tsx'), '\nexport {defaultLayout,normalizeLayout,NotebookPreview,PreviewText,normalizeParagraphMarks};');
function renderFooter(meta) {
  const layout = normalizeLayout(JSON.parse(JSON.stringify({ ...defaultLayout, mode: 'notebook', notebookMeta: meta })));
  return renderToStaticMarkup(NotebookPreview({ page: { id: 'page-1', text: '본문 내용', startOffset: 0 }, pageNumber: 3, rules: [], mosaicTerms: [], layout }));
}
test('blank notebook metadata removes the automatic footer after save and reload', () => {
  for (const meta of ['', '   ', '\n\t']) {
    const html = renderFooter(meta);
    assert.ok(!html.includes('notebook-page-number'));
    assert.ok(html.includes('본문 내용'));
  }
});
test('nonempty notebook metadata retains its label and actual page number', () => {
  const html = renderFooter('JOURNAL');
  assert.ok(html.includes('notebook-page-number'));
  assert.ok(html.includes('JOURNAL'));
  assert.ok(html.includes('<b>03</b>'));
});

test('selected paragraph alignment survives serialization and leaves other paragraphs unchanged', () => {
  const paragraphMarks = normalizeParagraphMarks(JSON.parse(JSON.stringify([{ id: 'align', start: 0, end: 5, align: 'center' }])));
  assert.equal(paragraphMarks[0].align, 'center');
  const html = renderToStaticMarkup(PreviewText({ text: 'first\n\nsecond', rules: [], mosaicTerms: [], paragraphMarks }));
  assert.match(html, /<p[^>]*text-align:center[^>]*><span>first<\/span><\/p>/);
  assert.match(html, /<p><span>second<\/span><\/p>/);
  assert.equal(normalizeParagraphMarks([{ id: 'empty', start: 0, end: 5, align: undefined }]).length, 0);
});