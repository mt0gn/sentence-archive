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
const { rebaseSpeakerAssignments: rebase } = load(path.join(root, 'app/speaker-rebase.ts'));
test('insert and remove earlier paragraphs without changing existing speakers', () => {
  const map = { 'text:0':'A', 'text:3':'B', 'manual-0-0:0':'A', 'manual-0-0:1':'B' };
  const added = rebase(map, '가\n\n나', '새\n\n가\n\n나');
  assert.equal(added['text:0'], '__narration__');
  assert.equal(added['text:3'], 'A');
  assert.equal(added['text:6'], 'B');
  assert.equal(added['manual-0-0:1'], undefined);
  const removed = rebase(added, '새\n\n가\n\n나', '가\n\n나');
  assert.equal(removed['text:3'], 'B');
});
test('reorder paragraphs and edit quotes without transferring speakers', () => {
  const map = { 'text:0':'A', 'text:3':'B' };
  const moved = rebase(map, '가\n\n나', '나\n\n가');
  assert.equal(moved['text:0'], 'B');
  assert.equal(moved['text:3'], 'A');
  const quoted = rebase(map, '가\n\n나', '"가"\n\n나');
  assert.equal(quoted['text:0'], 'A');
  assert.equal(quoted['text:5'], 'B');
});
test('duplicate messages preserve unaffected assignments', () => {
  const result = rebase({ 'text:0':'A','text:3':'B' }, '가\n\n가', '새\n\n가\n\n가');
  assert.equal(result['text:3'], 'A');
  assert.equal(result['text:6'], 'B');
});
test('split a message retains its speaker on both pieces', () => {
  const result = rebase({ 'text:0':'A', 'text:8':'B' }, 'abcdef\n\nother', 'abc\n\ndef\n\nother');
  assert.equal(result['text:0'], 'A');
  assert.equal(result['text:5'], 'A');
  assert.equal(result['text:10'], 'B');
});
test('merge and split restores both speakers including after serialization', () => {
  const merged = rebase({ 'text:0':'A', 'text:5':'B' }, 'abc\n\ndef', 'abcdef');
  assert.equal(merged['text:0'], 'A');
  assert.equal(merged['text:3'], 'B');
  const split = rebase(JSON.parse(JSON.stringify(merged)), 'abcdef', 'abc\n\ndef');
  assert.equal(split['text:0'], 'A');
  assert.equal(split['text:5'], 'B');
});
test('replace entire message keeps explicit speaker and leaves next alone', () => {
  const result = rebase({ 'text:0':'A', 'text:5':'B' }, 'abc\n\ndef', 'changed\n\ndef');
  assert.equal(result['text:0'], 'A');
  assert.equal(result['text:9'], 'B');
});
