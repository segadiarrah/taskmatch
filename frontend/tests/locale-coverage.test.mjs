import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function load(path) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', code)(mod, mod.exports);
  return mod.exports;
}

test('five languages and Portuguese regional preferences resolve consistently', () => {
  const { SUPPORTED_LOCALES, LOCALES, normalizeLocale, resolveLocale } = load('../src/lib/locales.ts');
  assert.deepEqual(new Set(SUPPORTED_LOCALES), new Set(['en', 'fr', 'zh', 'es', 'pt']));
  assert.equal(LOCALES.find(x => x.value === 'pt').native, 'Português');
  for (const input of ['pt', 'pt-BR', 'pt-PT', 'PT_br']) assert.equal(normalizeLocale(input), 'pt');
  assert.equal(resolveLocale('fr', ['pt-BR']), 'fr');
  assert.equal(resolveLocale(null, ['zh-Hans-CN']), 'zh');
  assert.equal(resolveLocale(null, ['es-419']), 'es');
  assert.equal(resolveLocale(null, ['fr-Latn-FR']), 'fr');
  assert.equal(resolveLocale(null, ['de-DE', 'pt-PT', 'en']), 'pt');
  assert.equal(resolveLocale('bad', ['en-GB']), 'en');
  for (const input of ['https://evil.test', '<script>', 'pt&x=en', '', null]) assert.equal(normalizeLocale(input), null);
});

test('Portuguese dictionary covers every key and preserves interpolation tokens', () => {
  const en = load('../src/i18n/en.ts').default;
  const pt = load('../src/i18n/pt.ts').default;
  function compare(a,b,path='') {
    assert.equal(typeof b, typeof a, path);
    if(typeof a === 'string') {
      assert.ok(b.trim(), path);
      assert.deepEqual([...b.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(), [...a.matchAll(/\{\w+\}/g)].map(x=>x[0]).sort(),path);
    } else {
      assert.deepEqual(Object.keys(b).sort(),Object.keys(a).sort(),path);
      Object.entries(a).forEach(([k,v])=>compare(v,b[k],`${path}.${k}`));
    }
  }
  compare(en,pt);
  assert.match(pt.dashboard.loadingApp,/Carregando|A carregar/);
  assert.match(pt.human.claim,/Aceitar/);
});
