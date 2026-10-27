// Builds index.html, a standalone copy of customs-journey.html for static hosts (Vercel, GitHub Pages).
// customs-journey.html leaves out the document skeleton because the Claude artifact host adds it;
// this adds the doctype, charset, viewport and a small reset. Run after editing the page:
//   node scripts/build-index.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const page = readFileSync(new URL('../customs-journey.html', import.meta.url), 'utf8');
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
