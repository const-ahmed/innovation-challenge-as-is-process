// Builds index.html, a standalone copy of customs-journey.html for static hosts (Vercel, GitHub Pages).
// customs-journey.html leaves out the document skeleton because the Claude artifact host adds it;
// this adds the doctype, charset, viewport and a small reset. It also points three.js and the
// fonts at the copies in vendor/, so the hosted site loads nothing from third-party CDNs (some
// work networks block them). And it stamps every script with a hash of its contents, so a
// browser or office proxy holding an old copy fetches the new one after a change. Run after
// editing the page or any script:
//   node scripts/build-index.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const stamp = path => `./${path}?v=${createHash('sha1').update(readFileSync(new URL(path, root))).digest('hex').slice(0, 8)}`;
const scripts = readdirSync(new URL('src/', root), { recursive: true }).filter(f => f.endsWith('.js')).map(f => `src/${f}`).sort();

// The import map remaps each script's plain URL to its stamped one. Relative imports between
// scripts resolve to those plain URLs, so they pick up the stamp too.
const importMap = JSON.stringify({
  imports: {
    three: stamp('vendor/three.module.js'),
    ...Object.fromEntries(scripts.map(f => [`./${f}`, stamp(f)])),
  },
}, null, 2);

let page = readFileSync(new URL('../customs-journey.html', import.meta.url), 'utf8');
const swap = (from, to) => {
  if (!from.test(page)) throw new Error(`build-index: expected to find ${from}`);
  page = page.replace(from, to);
};
swap(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/,
  `<link rel="stylesheet" href="${stamp('vendor/fonts/fonts.css')}">`);
swap(/<script type="importmap">[\s\S]*?<\/script>/, `<script type="importmap">\n${importMap}\n</script>`);
swap(/<script type="module" src="src\/main\.js"><\/script>/, `<script type="module" src="${stamp('src/main.js')}"></script>`);
const split = page.indexOf('</style>') + '</style>'.length;
const head = page.slice(0, split), body = page.slice(split).trim();

writeFileSync(new URL('../index.html', import.meta.url), `<!doctype html>
<!-- Generated from customs-journey.html by scripts/build-index.mjs. Edit that file, then rebuild. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>body { margin: 0; } img { max-width: 100%; }</style>
${head.trim()}
</head>
<body>
${body}
</body>
</html>
`);
console.log('wrote index.html');
