/**
 * 🔱 Athena Sites Registry Sync (v3.0 - Vault Aware)
 * Scans both Factory and Vault to update the central sites.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACTORY_ROOT = path.resolve(__dirname, '../..');
const SITES_DIR = path.join(FACTORY_ROOT, 'sites');
const VAULT_ROOT = path.resolve(FACTORY_ROOT, '../athena-vault-v8-1');
const VAULT_SITES = path.join(VAULT_ROOT, 'sites');
const OUTPUT_FILE = path.join(FACTORY_ROOT, 'dock/public/sites.json');
const PORTS_FILE = path.join(FACTORY_ROOT, 'factory/config/site-ports.json');

async function syncRegistry() {
    console.log("🔍 Scanning Factory & Vault for sites...");
    
    // Load existing ports
    let portMap = {};
    if (fs.existsSync(PORTS_FILE)) {
        try { portMap = JSON.parse(fs.readFileSync(PORTS_FILE, 'utf8')); } catch (e) {}
    }

    const registry = [];

    // Helper function to scan a directory
    const scanDir = (dir, isVault) => {
        if (!fs.existsSync(dir)) return;
        const items = fs.readdirSync(dir).filter(f => 
            fs.statSync(path.join(dir, f)).isDirectory() && !f.startsWith('.')
        );

        for (const project of items) {
            const projectPath = path.join(dir, project);
            const deployPath = path.join(projectPath, 'project-settings/deployment.json');
            const configPath = path.join(projectPath, 'athena-config.json');
            
            let deployData = {};
            let configData = {};
            
            if (fs.existsSync(deployPath)) {
                try { deployData = JSON.parse(fs.readFileSync(deployPath, 'utf8')); } catch (e) {}
            }
            
            if (fs.existsSync(configPath)) {
                try { configData = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) {}
            }

            const port = portMap[project] || 5000;
            const localUrl = `http://localhost:${port}/${project}/`;

            registry.push({
                id: project,
                name: configData.projectName || project,
                siteType: configData.siteType || 'unknown',
                generatedAt: configData.generatedAt || null,
                governance_mode: configData.governance_mode || 'dev-mode',
                repoUrl: deployData.repoUrl || null,
                liveUrl: deployData.liveUrl || null,
                localUrl: localUrl,
                port: port,
                status: isVault ? 'parked' : (deployData.status || 'local')
            });
        }
    };

    scanDir(SITES_DIR, false);
    scanDir(VAULT_SITES, true);

    // Deduplicate (Factory wins if same ID exists in both, which shouldn't happen)
    const uniqueRegistry = [];
    const seen = new Set();
    registry.forEach(site => {
        if (!seen.has(site.id)) {
            uniqueRegistry.push(site);
            seen.add(site.id);
        }
    });

    // Sort: live first, then alphabetical
    uniqueRegistry.sort((a, b) => {
        if (a.status === 'parked' && b.status !== 'parked') return 1;
        if (a.status !== 'parked' && b.status === 'parked') return -1;
        return a.id.localeCompare(b.id);
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueRegistry, null, 2));
    console.log(`✅ Registry updated with ${uniqueRegistry.length} sites (${uniqueRegistry.filter(s => s.status === 'parked').length} parked).`);
}

syncRegistry().catch(err => console.error(err));
