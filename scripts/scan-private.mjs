// Fails when the repository, the generated manifest or the built site contains private material.
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {join, relative, sep} from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SKIP = new Set(['node_modules', '.git', '.next/cache', 'test-results', 'playwright-report']);
const BINARY = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|map)$/i;
const SELF = new Set(['scripts/scan-private.mjs', 'tests/scan.test.ts', 'e2e/site.spec.ts']);

export const RULES = [
  ['private key', /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/],
  ['google api key', /AIza[0-9A-Za-z_-]{35}/],
  ['google access token', /\bya29\.[0-9A-Za-z_-]{20,}/],
  ['oauth client secret', /GOCSPX-[0-9A-Za-z_-]{20,}/],
  ['refresh token', /\b1\/\/[0-9A-Za-z_-]{40,}/],
  ['github token', /\b(?:ghp|gho|ghs|github_pat)_[0-9A-Za-z_]{20,}/],
  ['vercel token or oidc', /\b(?:VERCEL_OIDC_TOKEN|VERCEL_TOKEN)\s*[=:]\s*\S{8,}/],
  ['private sheet url', /docs\.google\.com\/spreadsheets\/d\/[0-9A-Za-z_-]{20,}/],
  ['private drive url', /drive\.google\.com\/(?:file\/d|drive\/folders)\/[0-9A-Za-z_-]{20,}/],
  ['private api route', /\/api\/atlas-(?:session|cockpit|private|access)/],
  ['private shadow marker', /\b(?:SHADOW_BOARD|atlas:shadow-board|NEXO_SESSION_SECRET|GOOGLE_REFRESH_TOKEN|GOOGLE_SERVICE_ACCOUNT_JSON)\b/],
  ['PIN literal', /\bPIN\s*[=:]\s*["']?\d{4,}/i]
];

export function scanText(text) {
  return RULES.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full).split(sep).join('/');
    if (SKIP.has(name) || SKIP.has(rel)) continue;
    const info = statSync(full);
    if (info.isDirectory()) yield* walk(full);
    else if (!BINARY.test(name) && info.size < 12 * 1024 * 1024) yield [full, rel];
  }
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('scan-private.mjs')) {
  const hits = [];
  let scanned = 0;
  for (const [full, rel] of walk(ROOT)) {
    if (SELF.has(rel) || rel.startsWith('.env')) continue;
    scanned++;
    const found = scanText(readFileSync(full, 'utf8'));
    for (const name of found) hits.push(`${rel}: ${name}`);
  }
  console.log(`scanned ${scanned} files${existsSync(join(ROOT, '.next')) ? ' (including the build)' : ''}`);
  if (hits.length) { console.error(hits.join('\n')); process.exit(1); }
  console.log('no private material found');
}
