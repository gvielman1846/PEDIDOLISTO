/**
 * Create Firebase default Storage bucket (requires Blaze plan).
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
  const existing = await getDefaultBucket();
  console.log('Bucket ya existe:', existing?.bucket?.name ?? existing);
  process.exit(0);
} catch (err) {
  if (err?.status !== 404) {
    console.log('Bucket no encontrado, creando...\n');
  }
}

try {
  const result = await createDefaultBucket();
  console.log('Bucket creado correctamente:');
  console.log(result?.bucket?.name ?? JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Error al crear bucket:', err.message ?? err);
  console.error('\nAbre la consola y clic en Comenzar:');
  console.error(`https://console.firebase.google.com/project/${PROJECT_ID}/storage`);
  process.exit(1);
}
