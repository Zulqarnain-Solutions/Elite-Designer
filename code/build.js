#!/usr/bin/env node
/* ==========================================================================
   build.js — bundles js/*.js into js/app.bundle.js
   --------------------------------------------------------------------------
   Why: index.html ships native ES modules, which browsers refuse to load
   from file:// (CORS). Served over http:// the modules are used as-is; when
   the page is opened straight from disk, index.html falls back to the bundle
   this script produces (a single classic script, no imports).

   Run after editing anything in js/:
       node build.js

   Zero dependencies — plain Node, regex transform, named imports/exports only.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, 'js');
const ENTRY = 'main.js';
const OUT_FILE = path.join(JS_DIR, 'app.bundle.js');

const IMPORT_RE = /(^|\n)[ \t]*import\s+([\s\S]*?)\s+from\s+['"](\.\/[^'"]+)['"]\s*;?[ \t]*(?=\n|$)/g;
const NAMED_IMPORT_RE = /^\s*\{([\s\S]*?)\}\s*$/;
const EXPORT_FN_RE = /^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm;
const EXPORT_VAR_RE = /^export\s+(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm;
const EXPORT_LIST_RE = /^export\s*\{([^}]*)\}\s*;?[ \t]*$/gm;
const EXPORT_KEYWORD_RE = /^export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\s)/gm;

const modules = new Map();
const order = [];

function resolveId(fromFile, spec) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec)).replace(/^\.\//, '');
}

function readModule(file) {
  if (modules.has(file)) return;
  const source = fs.readFileSync(path.join(JS_DIR, file), 'utf8');
  const bindings = [];

  let body = source.replace(IMPORT_RE, (match, lead, spec, from) => {
    const named = spec.match(NAMED_IMPORT_RE);
    if (!named) throw new Error(`${file}: only named imports are supported (got "${spec.trim()}")`);
    const names = named[1].split(',').map((s) => s.trim()).filter(Boolean);
    bindings.push({ dep: resolveId(file, from), names });
    return lead; // keep the line break so line numbers stay close to the source
  });

  const exported = [];
  body = body.replace(EXPORT_FN_RE, (m, name) => { exported.push([name, name]); return m; });
  body = body.replace(EXPORT_VAR_RE, (m, name) => { exported.push([name, name]); return m; });
  body = body.replace(EXPORT_LIST_RE, (m, list) => {
    list.split(',').map((s) => s.trim()).filter(Boolean).forEach((entry) => {
      const [local, alias] = entry.split(/\s+as\s+/);
      exported.push([local.trim(), (alias || local).trim()]);
    });
    return '';
  });
  body = body.replace(EXPORT_KEYWORD_RE, '');

  modules.set(file, { file, body: body.trimEnd(), bindings, exported });
  order.push(file);
  bindings.forEach((b) => readModule(b.dep));
}

readModule(ENTRY);

const chunks = [];
chunks.push(`/* ==========================================================================
   app.bundle.js — GENERATED FILE, DO NOT EDIT
   Built from js/*.js by build.js (run: node build.js).
   Only used when index.html is opened from disk (file://); over http:// the
   page loads the ES modules in js/main.js instead.
   ========================================================================== */
(function () {
'use strict';

var __defs = Object.create(null);
var __cache = Object.create(null);

function __define(id, fn) { __defs[id] = fn; }

function __require(id) {
  if (__cache[id]) return __cache[id];
  var fn = __defs[id];
  if (!fn) throw new Error('[elitedesigner] bundle is missing "' + id + '"');
  var exports = (__cache[id] = {});
  fn(exports, __require);
  return exports;
}
`);

order.forEach((file) => {
  const mod = modules.get(file);
  chunks.push(`/* ---------- js/${file} ---------- */`);
  chunks.push(`__define(${JSON.stringify(file)}, function (__exports, __require) {`);
  mod.bindings.forEach(({ dep, names }) => {
    const specs = names.map((n) => {
      const [local, alias] = n.split(/\s+as\s+/);
      return alias ? `${alias}: ${local}` : local;
    });
    chunks.push(`  var { ${specs.join(', ')} } = __require(${JSON.stringify(dep)});`);
  });
  chunks.push(mod.body);
  const pairs = mod.exported.map(([local, alias]) => (local === alias ? local : `${alias}: ${local}`));
  chunks.push(`  Object.assign(__exports, { ${pairs.join(', ')} });`);
  chunks.push('});');
  chunks.push('');
});

chunks.push(`__require(${JSON.stringify(ENTRY)});`);
chunks.push('})();');
chunks.push('');

fs.writeFileSync(OUT_FILE, chunks.join('\n'), 'utf8');
console.log(`bundled ${order.length} modules → js/${path.basename(OUT_FILE)} (${fs.statSync(OUT_FILE).size} bytes)`);
