/**
 * Setup Firebase for PedidoListo.
 * Prerequisites: npx firebase login
 *
 * Usage: node scripts/setup-firebase.mjs
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'pedidolisto-app';
const DISPLAY_NAME = 'PedidoListo';

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}

function projectExists(id) {
  try {
    const list = runCapture('npx firebase projects:list --json');
    const projects = JSON.parse(list).result ?? [];
    return projects.some((p) => p.projectId === id);
  } catch {
    return false;
  }
}

function parseSdkConfig(output) {
  const config = {};
  for (const line of output.split('\n')) {
    const m = line.match(/^\s*"?(\w+)"?\s*:\s*"?([^",]+)"?,?\s*$/);
    if (m) config[m[1]] = m[2];
  }
  return config;
}

console.log('=== PedidoListo Firebase Setup ===\n');

try {
  runCapture('npx firebase projects:list --limit 1');
} catch {
  console.error('\nError: ejecuta primero: npx firebase login\n');
  process.exit(1);
}

if (!projectExists(PROJECT_ID)) {
  console.log(`Creando proyecto: ${PROJECT_ID}`);
  try {
    run(`npx firebase projects:create ${PROJECT_ID} --display-name "${DISPLAY_NAME}"`);
  } catch {
    const alt = `${PROJECT_ID}-${Date.now().toString(36).slice(-4)}`;
    console.log(`ID ocupado, probando: ${alt}`);
    run(`npx firebase projects:create ${alt} --display-name "${DISPLAY_NAME}"`);
    writeFileSync(
      join(root, '.firebaserc'),
      JSON.stringify({ projects: { default: alt } }, null, 2) + '\n'
    );
  }
}

run(`npx firebase use ${PROJECT_ID}`);

console.log('\nCreando base de datos Firestore (si no existe)...');
try {
  run('npx firebase firestore:databases:create --location=us-central1 --database "(default)"');
} catch {
  console.log('Firestore ya existe o se creara en el primer deploy.');
}

console.log('\nRegistrando app web...');
let sdkOutput = '';
try {
  sdkOutput = runCapture(`npx firebase apps:create WEB "PedidoListo Web" --project ${PROJECT_ID} --json`);
} catch {
  console.log('App web ya registrada, obteniendo config...');
}

let config = {};
try {
  const apps = JSON.parse(runCapture(`npx firebase apps:list WEB --project ${PROJECT_ID} --json`));
  const appId = apps.result?.[0]?.appId;
  if (appId) {
    const sdk = runCapture(`npx firebase apps:sdkconfig WEB ${appId} --project ${PROJECT_ID}`);
    config = parseSdkConfig(sdk);
  }
} catch (e) {
  console.warn('No se pudo leer SDK config automaticamente:', e.message);
}

console.log('\nDesplegando reglas Firestore y Storage...');
run('npx firebase deploy --only firestore:rules,firestore:indexes,storage');

const envLines = [
  `VITE_FIREBASE_API_KEY=${config.apiKey ?? ''}`,
  `VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain ?? `${PROJECT_ID}.firebaseapp.com`}`,
  `VITE_FIREBASE_PROJECT_ID=${config.projectId ?? PROJECT_ID}`,
  `VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket ?? `${PROJECT_ID}.firebasestorage.app`}`,
  `VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId ?? ''}`,
  `VITE_FIREBASE_APP_ID=${config.appId ?? ''}`,
];

const envPath = join(root, 'apps/web-catalog/.env.local');
writeFileSync(envPath, envLines.join('\n') + '\n');

console.log('\n=== Variables guardadas en apps/web-catalog/.env.local ===');
console.log(envLines.join('\n'));

console.log(`
=== PASOS MANUALES EN FIREBASE CONSOLE (2 min) ===
1. https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers
   - Activar "Correo electronico/Contrasena"
   - Activar "Google" y elegir email de soporte

2. https://console.firebase.google.com/project/${PROJECT_ID}/storage
   - Si Storage pide activarse, clic en "Comenzar"

=== VERCEL (copia las variables de .env.local) ===
Settings > Environment Variables > agrega cada VITE_FIREBASE_*
Luego: Deployments > Redeploy

O con CLI (si tienes vercel login):
  cd apps/web-catalog
  npx vercel env add VITE_FIREBASE_API_KEY production
  (repite para cada variable)
`);

console.log('\nSetup completado.');
