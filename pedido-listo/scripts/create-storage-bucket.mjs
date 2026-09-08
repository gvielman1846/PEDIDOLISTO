/**
 * Create Firebase default Storage bucket (requires Blaze plan + firebase login).
 * Run: node scripts/create-storage-bucket.mjs
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PROJECT_ID = 'pedidolisto-app';

const apiv2 = require('firebase-tools/lib/apiv2');
const api = require('firebase-tools/lib/api');
const auth = require('firebase-tools/lib/auth');
const requireAuth = require('firebase-tools/lib/requireAuth');

async function initAuth() {
  const options = { project: PROJECT_ID, projectId: PROJECT_ID, cwd: root };
  const account = auth.getGlobalDefaultAccount();
  if (account) {
    auth.setActiveAccount(options, account);
  }
  await requireAuth.requireAuth(options);
  return options;
}

async function getDefaultBucket() {
  const client = new apiv2.Client({
    urlPrefix: api.firebaseStorageOrigin(),
    apiVersion: 'v1alpha',
  });
  const response = await client.get(`/projects/${PROJECT_ID}/defaultBucket`);
  return response.body;
}

async function createDefaultBucket() {
  const client = new apiv2.Client({
    urlPrefix: api.firebaseStorageOrigin(),
    apiVersion: 'v1alpha',
  });
  const response = await client.post(`/projects/${PROJECT_ID}/defaultBucket`, {
    location: 'us-central1',
  });
  return response.body;
}

console.log('=== Crear bucket de Storage ===\n');

try {
  await initAuth();
} catch {
  console.error('Error: ejecuta primero: npx firebase login\n');
  process.exit(1);
}

let needsCreate = false;

try {
  const existing = await getDefaultBucket();
  if (existing?.bucket?.name) {
    console.log('Bucket ya existe:', existing.bucket.name);
    process.exit(0);
  }
  needsCreate = true;
} catch (err) {
  // 404 o bucket aun no provisionado
  if (err?.status === 404 || String(err?.message ?? '').includes('defaultBucket')) {
    needsCreate = true;
  } else {
    console.error('Error al consultar bucket:', err.message ?? err);
    process.exit(1);
  }
}

if (!needsCreate) {
  console.log('Bucket listo.');
  process.exit(0);
}

console.log('Bucket no encontrado, creando...\n');

try {
  const result = await createDefaultBucket();
  console.log('Bucket creado correctamente:');
  console.log(result?.bucket?.name ?? JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Error al crear bucket:', err.message ?? err);
  console.error('\nAlternativa: abre la consola y clic en "Comenzar":');
  console.error(`https://console.firebase.google.com/project/${PROJECT_ID}/storage`);
  process.exit(1);
}
