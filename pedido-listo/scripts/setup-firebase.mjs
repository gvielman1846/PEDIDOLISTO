/**
 * Setup Firebase for PedidoListo.
 * Prerequisites: npx firebase login
 *
 * Usage: node scripts/setup-firebase.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const DISPLAY_NAME = 'PedidoListo';

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}

function getDefaultProjectId() {
  try {
    const rc = JSON.parse(readFileSync(join(root, '.firebaserc'), 'utf8'));
    return rc.projects?.default ?? 'pedidolisto-app';
  } catch {
    return 'pedidolisto-app';
  }
}

function setDefaultProjectId(id) {
  writeFileSync(
    join(root, '.firebaserc'),
    JSON.stringify({ projects: { default: id } }, null, 2) + '\n'
  );
}

function listProjects() {
  const raw = runCapture('npx firebase projects:list --json');
  const parsed = JSON.parse(raw);
  return parsed.result ?? parsed.projects ?? [];
}

function projectExists(id, projects) {
  return projects.some((p) => p.projectId === id);
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

let projects;
try {
  projects = listProjects();
  console.log(`Sesion activa. Proyectos encontrados: ${projects.length}`);
} catch (e) {
  console.error('\nError: ejecuta primero: npx firebase login\n');
  console.error(e.message);
  process.exit(1);
}

let projectId = process.env.FIREBASE_PROJECT_ID ?? getDefaultProjectId();

if (!projectExists(projectId, projects)) {
  console.log(`Creando proyecto: ${projectId}`);
  try {
    run(`npx firebase projects:create ${projectId} --display-name "${DISPLAY_NAME}"`);
    setDefaultProjectId(projectId);
  } catch {
    const alt = `${projectId}-${Date.now().toString(36).slice(-4)}`;
    console.log(`ID ocupado, probando: ${alt}`);
    run(`npx firebase projects:create ${alt} --display-name "${DISPLAY_NAME}"`);
    projectId = alt;
    setDefaultProjectId(projectId);
  }
  projects = listProjects();
}

run(`npx firebase use ${projectId}`);

console.log('\nCreando base de datos Firestore (si no existe)...');
try {
  run(`npx firebase firestore:databases:create --location=us-central1 --database "(default)" --project ${projectId}`);
} catch {
  console.log('Firestore ya existe o se creara en el primer deploy.');
}

console.log('\nRegistrando app web...');
try {
  runCapture(`npx firebase apps:create WEB "PedidoListo Web" --project ${projectId} --json`);
} catch {
  console.log('App web ya registrada, obteniendo config...');
}

let config = {};
try {
  const apps = JSON.parse(runCapture(`npx firebase apps:list WEB --project ${projectId} --json`));
  const appId = apps.result?.[0]?.appId;
  if (appId) {
    const sdk = runCapture(`npx firebase apps:sdkconfig WEB ${appId} --project ${projectId}`);
    config = parseSdkConfig(sdk);
  }
} catch (e) {
  console.warn('No se pudo leer SDK config automaticamente:', e.message);
}

console.log('\nDesplegando reglas Firestore...');
try {
  run(`npx firebase deploy --only firestore:rules --project ${projectId}`);
} catch (e) {
  console.warn('\nFirestore rules fallaron:', e.message);
}

console.log('\nDesplegando Storage (requiere activar Storage en consola si es proyecto nuevo)...');
try {
  run(`npx firebase deploy --only storage --project ${projectId}`);
} catch {
  console.warn('\nStorage no listo aun. Abre y clic "Comenzar":');
  console.warn(`https://console.firebase.google.com/project/${projectId}/storage`);
  console.warn('Luego corre: npm run firebase:storage\n');
}

const envLines = [
  `VITE_FIREBASE_API_KEY=${config.apiKey ?? ''}`,
  `VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain ?? `${projectId}.firebaseapp.com`}`,
  `VITE_FIREBASE_PROJECT_ID=${config.projectId ?? projectId}`,
  `VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket ?? `${projectId}.firebasestorage.app`}`,
  `VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId ?? ''}`,
  `VITE_FIREBASE_APP_ID=${config.appId ?? ''}`,
];

const envPath = join(root, 'apps/web-catalog/.env.local');
writeFileSync(envPath, envLines.join('\n') + '\n');

console.log('\n=== Variables guardadas en apps/web-catalog/.env.local ===');
console.log(envLines.join('\n'));

console.log(`
=== PASOS MANUALES EN FIREBASE CONSOLE (2 min) ===
1. https://console.firebase.google.com/project/${projectId}/authentication/providers
   - Activar "Correo electronico/Contrasena"
   - Activar "Google" y elegir email de soporte

2. https://console.firebase.google.com/project/${projectId}/storage
   - Si Storage pide activarse, clic en "Comenzar"

=== VERCEL (copia las variables de .env.local) ===
Settings > Environment Variables > agrega cada VITE_FIREBASE_*
Luego: Deployments > Redeploy
`);

console.log('\nSetup completado.');
