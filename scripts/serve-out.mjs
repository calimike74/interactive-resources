// serve-out - the built static export, served the way Vercel serves it, for
// the gates to measure. Written 12 Sep 2026, when a scratch server and a
// `.html` URL between them cost an hour: `next start` refuses an export, a
// plain file server has no clean URLs, and `/squared-paper.html` fails both
// check-bench's fixture lookup (it keys on the URL's last path segment) and
// the app's own router, which reads the resource id from the address and
// renders a different page under the right HTML.
//
//   npx next build
//   node scripts/serve-out.mjs &                       # port 3416 by default
//   node scripts/check-paper.mjs http://localhost:3416/squared-paper
//   node scripts/check-bench.mjs http://localhost:3416/delay-effects
//
//   node scripts/serve-out.mjs out 3417                # another port, or dir
//
// No dependencies and no caching: it exists to be pointed at and killed.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || path.join(here, '..', 'out'));
const port = Number(process.argv[3] || 3416);

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.wasm': 'application/wasm',
};

if (!fs.existsSync(root)) {
    console.error(`no export at ${root}: run npx next build first`);
    process.exit(2);
}

// A request for /squared-paper is answered by out/squared-paper.html, which
// is how the site itself serves it.
function fileFor(urlPath) {
    const clean = path.normalize(decodeURIComponent(urlPath.split('?')[0]));
    if (clean.includes('..')) return null;
    for (const candidate of [
        path.join(root, clean),
        path.join(root, clean, 'index.html'),
        path.join(root, `${clean}.html`),
    ]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    return null;
}

http.createServer((req, res) => {
    const file = fileFor(req.url === '/' ? '/index' : req.url);
    if (!file) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('not found');
        return;
    }
    res.writeHead(200, {
        'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
}).listen(port, () => {
    console.log(`serving ${root} on http://localhost:${port}`);
});
