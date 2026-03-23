/**
 * 🚜 Athena 3.0 Vault Forklift (v2)
 * Moves sites between Factory (athena-y) and Vault (athena-vault-v8-1).
 * Handles (De)hydration automatically.
 * 
 * Usage: 
 *   node factory/6-utilities/vault-forklift.js --to-vault <site-name>
 *   node factory/6-utilities/vault-forklift.js --from-vault <site-name>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
// Root is ~/0-IT/3-DEV/myAgent
const ROOT = path.resolve(__dirname, '../../..'); 
const FACTORY_SITES = path.join(ROOT, 'athena-y/sites');
const VAULT_ROOT = path.join(ROOT, 'athena-vault-v8-1');
const VAULT_SITES = path.join(VAULT_ROOT, 'sites');

function dehydrate(sitePath) {
    console.log(`🌵 Dehydrating... (removing node_modules & dist)`);
    const targets = ['node_modules', 'dist', '.git'];
    targets.forEach(t => {
        const p = path.join(sitePath, t);
        if (fs.existsSync(p)) {
            execSync(`rm -rf "${p}"`);
            console.log(`  ✅ Removed ${t}`);
        }
    });
}

function hydrate(sitePath) {
    console.log(`💧 Hydrating... (running pnpm install)`);
    try {
        execSync('pnpm install --no-frozen-lockfile', { cwd: sitePath, stdio: 'inherit' });
        console.log(`  ✅ Hydration complete.`);
    } catch (e) {
        console.error(`  ❌ Hydration failed: ${e.message}`);
    }
}

async function run() {
    const mode = process.argv[2]; // --to-vault or --from-vault
    const siteName = process.argv[3];

    if (!mode || !siteName) {
        console.error("❌ Usage: node vault-forklift.js <--to-vault|--from-vault> <site-name>");
        process.exit(1);
    }

    if (mode === '--to-vault') {
        const source = path.join(FACTORY_SITES, siteName);
        const dest = path.join(VAULT_SITES, siteName);

        if (!fs.existsSync(source)) {
            console.error(`❌ Site '${siteName}' not found in Factory (${source}).`);
            process.exit(1);
        }

        console.log(`🚜 Moving '${siteName}' to Vault...`);
        dehydrate(source);

        if (!fs.existsSync(VAULT_SITES)) fs.mkdirSync(VAULT_SITES, { recursive: true });
        
        // Move instead of rsync to be true to the "forklift" metaphor and avoid duplicates
        execSync(`mv "${source}" "${dest}"`);
        
        // Ledger update in Vault
        try {
            execSync(`git add . && git commit -m "🚜 Parked site: ${siteName}"`, { cwd: VAULT_ROOT });
        } catch (e) {}

        console.log(`\n🎉 Site '${siteName}' is now safely parked in the Vault.`);

    } else if (mode === '--from-vault') {
        const source = path.join(VAULT_SITES, siteName);
        const dest = path.join(FACTORY_SITES, siteName);

        if (!fs.existsSync(source)) {
            console.error(`❌ Site '${siteName}' not found in Vault.`);
            process.exit(1);
        }

        console.log(`🚜 Fetching '${siteName}' from Vault...`);
        
        if (!fs.existsSync(FACTORY_SITES)) fs.mkdirSync(FACTORY_SITES, { recursive: true });
        
        execSync(`mv "${source}" "${dest}"`);
        
        hydrate(dest);

        // Ledger update in Vault (removal)
        try {
            execSync(`git add . && git commit -m "🚜 Unparked site: ${siteName}"`, { cwd: VAULT_ROOT });
        } catch (e) {}

        console.log(`\n🎉 Site '${siteName}' is back in the Factory and ready for work.`);
    } else {
        console.error("❌ Invalid mode. Use --to-vault or --from-vault.");
    }
}

run();
