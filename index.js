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