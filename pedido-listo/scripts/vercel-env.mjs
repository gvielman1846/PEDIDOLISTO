/**
 * Push Firebase env vars to Vercel.
 * Requires: npx vercel login
 * Run: npm run vercel:env
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, 'apps/web-catalog/.env.local');
const webCatalog = join(root, 'apps/web-catalog');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: webCatalog, stdio: 'inherit', shell: true });
}

let envContent;
try {
  envContent = readFileSync(envPath, 'utf8');
} catch {
  console.error('No existe .env.local. Corre primero: npm run firebase:setup');
  process.exit(1);
}

const vars = envContent
  .split('\n')
  .filter((line) => line.startsWith('VITE_FIREBASE_'))
  .map((line) => {
    const [key, ...rest] = line.split('=');
    return { key, value: rest.join('=') };
  });

console.log('=== Subiendo variables a Vercel ===\n');

for (const { key, value } of vars) {
  if (!value) continue;
  run(`echo ${value}| npx vercel env add ${key} production preview development --force`);
}

console.log('\nVariables subidas. Haz Redeploy en Vercel.');
