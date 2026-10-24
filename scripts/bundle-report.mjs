import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const platform = process.argv[2] ?? 'ios';
const dir = join('dist', '_expo', 'static', 'js', platform);

let files;
try {
  files = readdirSync(dir);
} catch {
  console.error(`No ${platform} bundle found. Run: npx expo export --platform ${platform} --dump-sourcemap`);
  process.exit(1);
}

const bundle = files.find((file) => file.endsWith('.hbc') || file.endsWith('.js'));
const mapFile = files.find((file) => file.endsWith('.map'));
if (!bundle || !mapFile) {
  console.error('Bundle or sourcemap missing. Re-run the export with --dump-sourcemap.');
  process.exit(1);
}

const map = JSON.parse(readFileSync(join(dir, mapFile), 'utf8'));
const totals = new Map();

const bucketOf = (source) => {
  const normalized = source.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('node_modules/');
  if (index === -1) return normalized.includes('/src/') || normalized.startsWith('src/') ? 'app (src/)' : 'other';
  const rest = normalized.slice(index + 'node_modules/'.length).split('/');
  return rest[0]?.startsWith('@') ? `${rest[0]}/${rest[1]}` : (rest[0] ?? 'other');
};

map.sources.forEach((source, index) => {
  const size = Buffer.byteLength(map.sourcesContent?.[index] ?? '', 'utf8');
  const key = bucketOf(source);
  totals.set(key, (totals.get(key) ?? 0) + size);
});

const sum = [...totals.values()].reduce((a, b) => a + b, 0);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

console.log(`Bundle: ${bundle} — ${kb(statSync(join(dir, bundle)).size)} on disk (Hermes bytecode)`);
console.log(`Source modules: ${map.sources.length}, original source ${kb(sum)}\n`);
console.log('| Package | Source size | Share |');
console.log('| --- | ---: | ---: |');
[...totals.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, Number(process.argv[3] ?? 15))
  .forEach(([name, size]) => console.log(`| ${name} | ${kb(size)} | ${((size / sum) * 100).toFixed(1)}% |`));
