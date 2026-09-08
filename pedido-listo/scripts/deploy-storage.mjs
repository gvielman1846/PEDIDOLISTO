/**
 * Finish Storage deploy after enabling Storage in Firebase Console.
 * Run: npm run firebase:storage
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PROJECT_ID = 'pedidolisto-app';
const STORAGE_URL = `https://console.firebase.google.com/project/${PROJECT_ID}/storage`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deployStorage() {
  execSync(`npx firebase deploy --only storage --project ${PROJECT_ID}`, {
    cwd: root,
    stdio: 'inherit',
  });
}

console.log('=== Firebase Storage Deploy ===\n');
console.log('Si falla, abre esta URL y clic en "Comenzar":');
console.log(STORAGE_URL);
console.log('');

for (let attempt = 1; attempt <= 10; attempt++) {
  try {
    console.log(`Intento ${attempt}/10...`);
    deployStorage();
    console.log('\nStorage rules desplegadas correctamente.');
    process.exit(0);
  } catch {
    if (attempt === 10) {
      console.error('\nNo se pudo desplegar Storage. Activalo en la consola y vuelve a correr:');
      console.error('npm run firebase:storage\n');
      process.exit(1);
    }
    console.log('Esperando 15s (activa Storage en consola si aun no lo hiciste)...\n');
    await sleep(15000);
  }
}
