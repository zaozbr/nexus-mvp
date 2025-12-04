/* NEXUS MVP: P2P Folder Sync (CLI) */
const Hyperdrive = require('hyperdrive');
const Hyperswarm = require('hyperswarm');
const Corestore = require('corestore');
const Localdrive = require('localdrive');
const mirror = require('mirror-drive');
const process = require('bare-process');
const path = require('bare-path');

// Helper to parse CLI arguments
// Usage: pear run . --mode=host --dir=./my-folder
const args = {};
process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    args[key.replace(/^--/, '')] = value || true;
});

async function main() {
    const mode = args.mode || 'host'; // Default to host
    const dir = args.dir || './nexus-sync'; // Default folder
    const remoteKey = args.key;

    // Resolve absolute path for the folder we want to sync
    const targetDir = path.resolve(dir);

    console.log(`[NEXUS MVP] Starting in ${mode.toUpperCase()} mode`);
    console.log(`[TARGET] ${targetDir}`);

    // 1. Setup Corestore (Internal DB)
    const store = new Corestore(`./storage-${mode}`);
    await store.ready();

    // 2. Setup Networking
    const swarm = new Hyperswarm();
    // When a peer connects, replicate the corestore data stream to them
    swarm.on('connection', (socket) => store.replicate(socket));

    // 3. Setup Drives

    // Localdrive: Represents your real OS folder
    const local = new Localdrive(targetDir);

    // Hyperdrive: Represents the P2P Virtual Drive
    // Client needs the remoteKey to find data. Host generates a null key (new drive).
    const hyper = new Hyperdrive(store, remoteKey ? Buffer.from(remoteKey, 'hex') : null);
    await hyper.ready();

    // 4. Join Swarm
    // We announce (Host) or look for (Client) the drive's specific discovery key
    const discovery = hyper.discoveryKey;
    swarm.join(discovery);
    await swarm.flush(); // Wait for announcement to propagate

}