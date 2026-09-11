/**
 * Crear una o mas cocineras en Firestore.
 *
 * Uso rapido:
 *   npm run seed:business -- --name "Cocina de Maria" --slug cocina-maria --whatsapp 5255512345678 --address "Col. Jardines, Tlajomulco"
 *
 * Desde archivo JSON:
 *   npm run seed:business -- --file scripts/businesses.example.json
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadDemoMenu,
  root,
  seedBusiness,
  signIn,
  slugify,
} from './seed-lib.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      args[name] = true;
      continue;
    }
    args[name] = value;
    i++;
  }
  return args;
}

function printUsage() {
  console.log(`
Crear cocinera(s) en Firebase

Opcion A — una cocinera:
  npm run seed:business -- \\
    --name "Cocina de Maria" \\
    --slug cocina-maria \\
    --whatsapp 5255512345678 \\
    --address "Col. Jardines, Tlajomulco"

Opcion B — varias desde JSON:
  npm run seed:business -- --file scripts/businesses.example.json

Flags opcionales:
  --id cocina-maria        ID en Firestore (default: mismo que slug)
  --delivery-fee 25
  --min-order 80
  --open 09:00
  --close 20:00
  --force                  Actualizar aunque ya tenga dueno
`);
}

function buildBusinessFromArgs(args) {
  if (!args.name || !args.whatsapp) {
    printUsage();
    process.exit(1);
  }

  const slug = args.slug ? slugify(args.slug) : slugify(args.name);

  return {
    id: args.id ? slugify(args.id) : slug,
    name: args.name,
    slug,
    whatsapp: args.whatsapp.replace(/\D/g, ''),
    address: args.address ?? '',
    deliveryFee: Number(args['delivery-fee'] ?? 25),
    minOrder: Number(args['min-order'] ?? 80),
    openTime: args.open ?? '09:00',
    closeTime: args.close ?? '20:00',
    copyMenuFromDemo: args.menu !== 'empty',
    force: Boolean(args.force),
  };
}

function loadBusinessesFromFile(filePath) {
  const resolved = resolve(root, filePath);
  const content = readFileSync(resolved, 'utf8');
  const data = JSON.parse(content);
  if (!Array.isArray(data.businesses)) {
    throw new Error('El archivo JSON debe tener un array "businesses"');
  }
  return data.businesses;
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printUsage();
  process.exit(0);
}

let businesses = [];

if (args.file) {
  businesses = loadBusinessesFromFile(args.file);
} else if (args.name) {
  businesses = [buildBusinessFromArgs(args)];
} else {
  printUsage();
  process.exit(1);
}

const demoMenu = loadDemoMenu();
const firebase = await signIn();
const results = [];

for (const entry of businesses) {
  const slug = slugify(entry.slug ?? entry.name);
  const businessId = entry.id ? slugify(entry.id) : slug;
  const menu = entry.copyMenuFromDemo === false ? { categories: [], products: [] } : demoMenu;

  const result = await seedBusiness(firebase, {
    businessId,
    name: entry.name,
    slug,
    whatsapp: String(entry.whatsapp).replace(/\D/g, ''),
    address: entry.address ?? '',
    deliveryFee: entry.deliveryFee ?? 25,
    minOrder: entry.minOrder ?? 80,
    openTime: entry.openTime ?? '09:00',
    closeTime: entry.closeTime ?? '20:00',
    isOpen: entry.isOpen ?? true,
    plan: entry.plan ?? 'free',
    menu,
    force: Boolean(entry.force ?? args.force),
  });

  results.push(result);
}

console.log('\n=== Cocineras listas ===\n');
for (const result of results) {
  console.log(`• ${result.businessId}`);
  console.log(`  Catalogo: https://pedidolisto-jet.vercel.app${result.catalogUrl}`);
  console.log(`  Local:    http://localhost:5173${result.catalogUrl}\n`);
}
