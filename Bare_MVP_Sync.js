/* NEXUS MVP: P2P Folder Sync (CLI)

   Dependencies needed:
   npm install hyperdrive hyperswarm corestore localdrive mirror-drive bare-process bare-path
*/

const Hyperdrive = require('hyperdrive');
const Hyperswarm = require('hyperswarm');
const Corestore = require('corestore');
const Localdrive = require('localdrive');
const mirror = require('mirror-drive');
const process = require('bare-process');
const path = require('bare-path');

// Helper to parse CLI arguments
// format: pear run . --key=<hex> --dir=./folder
const args = {};
process.argv.slice(2).forEach(arg => {
  const [key, value] = arg.split('=');
  args[key.replace(/^--/, '')] = value || true;
});

async function main() {
  const mode = args.mode || 'host'; // 'host' or 'client'
  const dir = args.dir || './nexus-sync'; // Default folder
  const remoteKey = args.key;

  // Resolve absolute path for the folder we want to sync
  const targetDir = path.resolve(dir);

  console.log(`[NEXUS MVP] Starting in ${mode.toUpperCase()} mode`);
  console.log(`[TARGET] ${targetDir}`);

  // 1. Setup Corestore (Internal DB)
  // We use different storage paths to simulate different machines on one PC
  const store = new Corestore(`./storage-${mode}`);
  await store.ready();

  // 2. Setup Networking
  const swarm = new Hyperswarm();
  swarm.on('connection', (socket) => store.replicate(socket));

  // 3. Setup Drives
  // Localdrive: Represents your real OS folder
  const local = new Localdrive(targetDir);

  // Hyperdrive: Represents the P2P Virtual Drive
  // If Client: we need the remote key. If Host: we generate a new one.
  const hyper = new Hyperdrive(store, remoteKey ? Buffer.from(remoteKey, 'hex') : null);
  await hyper.ready();

  // 4. Join Swarm
  const discovery = hyper.discoveryKey;
  swarm.join(discovery);
  await swarm.flush();

  // 5. Logic Branch
  if (mode === 'host') {
    console.log('\n==================================================');
    console.log(' SHARE THIS KEY TO SYNC:');
    console.log(' ' + hyper.key.toString('hex'));
    console.log('==================================================\n');

    // MIRROR: Local (OS) -> Hyperdrive (P2P)
    // { live: true } keeps watching for changes indefinitely
    console.log('[WATCHING] mirroring changes from Local -> P2P...');

    const out = mirror(local, hyper, { live: true });

    out.on('put', (src) => console.log(`[UPLOAD] Added: ${src.key}`));
    out.on('del', (src) => console.log(`[UPLOAD] Deleted: ${src.key}`));

  } else {
    if (!remoteKey) {
      console.error('[ERROR] Client mode requires --key=<hex>');
      process.exit(1);
    }

    console.log('[CONNECTING] Looking for Host...');

    // MIRROR: Hyperdrive (P2P) -> Local (OS)
    console.log('[WATCHING] mirroring changes from P2P -> Local...');

    const inc = mirror(hyper, local, { live: true });

    inc.on('put', (src) => console.log(`[DOWNLOAD] Added: ${src.key}`));
    inc.on('del', (src) => console.log(`[DOWNLOAD] Deleted: ${src.key}`));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});