/**
 * @file DataManager.js
 * @description Unified data management for Athena monorepo. 
 *              Consolidates JSON, TSV, and Google Sheets sync logic.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { google } from 'googleapis';
import csv from 'csvtojson';

export class AthenaDataManager {
    constructor(root) {
        this.root = root;
    }

    /**
     * Resolve project and site directories (handles -site suffix)
     */
    resolvePaths(projectName) {
        const safeName = projectName.toLowerCase().replace(/\s+/g, '-');
        
        let siteDir = path.resolve(this.root, '../sites', safeName);
        if (!fs.existsSync(siteDir)) {
            const altSiteDir = path.resolve(this.root, '../sites', `${safeName}-site`);
            if (fs.existsSync(altSiteDir)) siteDir = altSiteDir;
        }

        const inputDir = path.resolve(this.root, '../input', safeName);
        
        return {
            projectName: safeName,
            siteDir,
            inputDir,
            dataDir: path.join(siteDir, 'src/data'),
            settingsDir: path.join(siteDir, 'project-settings'),
            tsvDir: path.join(inputDir, 'tsv-data')
        };
    }

    /**
     * Get Google Auth client
     */
    getAuth() {
        let serviceAccountPath = path.join(this.root, 'sheet-service-account.json');
        if (!fs.existsSync(serviceAccountPath)) {
            serviceAccountPath = path.join(this.root, 'service-account.json');
        }

        if (!fs.existsSync(serviceAccountPath)) {
            throw new Error("❌ No sheet-service-account.json or service-account.json found in the root.");
        }

        return new google.auth.GoogleAuth({
            keyFile: serviceAccountPath,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.metadata.readonly'
            ],
        });
    }

    /**
     * Backup existing data files
     */
    backupData(siteDir, dataDir) {
        if (!fs.existsSync(dataDir)) return;
        
        const backupsRoot = path.join(siteDir, 'backups');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(backupsRoot, `data_${timestamp}`);
        
        console.log(`📦 Creating backup: backups/data_${timestamp}...`);
        fs.mkdirSync(backupDir, { recursive: true });
        
        const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
        files.forEach(file => {
            fs.copyFileSync(path.join(dataDir, file), path.join(backupDir, file));
        });

        // Prune old backups (keep last 2)
        try {
            const existingBackups = fs.readdirSync(backupsRoot)
                .filter(f => f.startsWith('data_'))
                .sort();
            
            if (existingBackups.length > 2) {
                const toDelete = existingBackups.slice(0, existingBackups.length - 2);
                toDelete.forEach(folder => {
                    fs.rmSync(path.join(backupsRoot, folder), { recursive: true, force: true });
                    console.log(`🗑️ Pruned old backup: ${folder}`);
                });
            }
        } catch (e) {}
    }

    /**
     * Fixes hardcoded legacy links (e.g., athena-x -> athena-y) in content strings.
     */
    fixHardcodedLinks(content) {
        if (typeof content !== 'string') return content;
        
        const legacyPatterns = [
            /https?:\/\/athena-cms-factory\.github\.io/g,
            /https?:\/\/athena-x\.github\.io/g,
            /https?:\/\/kareltestspecial\.github\.io/g
        ];

        const currentOwner = process.env.GITHUB_OWNER || "athena-y-factory";
        const currentDomain = `https://${currentOwner}.github.io`;

        let fixed = content;
        legacyPatterns.forEach(pattern => {
            fixed = fixed.replace(pattern, currentDomain);
        });

        return fixed;
    }

    /**
     * Recursively traverse data and fix links in all strings.
     */
    deepFixLinks(data) {
        if (typeof data === 'string') return this.fixHardcodedLinks(data);
        if (Array.isArray(data)) return data.map(item => this.deepFixLinks(item));
        if (data !== null && typeof data === 'object') {
            const fixed = {};
            Object.entries(data).forEach(([k, v]) => {
                fixed[k] = this.deepFixLinks(v);
            });
            return fixed;
        }
        return data;
    }

    /**
     * Load JSON data
     */
    loadJSON(filePath) {
        if (!fs.existsSync(filePath)) return null;
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return this.deepFixLinks(data);
    }

    /**
     * Save JSON data
     */
    saveJSON(filePath, data) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }

    /**
     * Sync from Sheet (Authenticated via Google Sheets API)
     */
    async syncFromSheet(projectName) {
        const paths = this.resolvePaths(projectName);
        if (!fs.existsSync(paths.siteDir)) throw new Error(`Site directory not found for ${projectName}`);

        const settingsPath = path.join(paths.settingsDir, 'url-sheet.json');
        if (!fs.existsSync(settingsPath)) {
             console.warn("⚠️ No url-sheet.json found. Falling back to unauthenticated 'pnpm fetch-data'...");
             execSync('pnpm fetch-data', { cwd: paths.siteDir, stdio: 'inherit' });
             return { success: true, message: "Unauthenticated fetch-data performed." };
        }

        const urlConfig = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const firstUrl = (urlConfig._system || Object.values(urlConfig)[0]).editUrl;
        const spreadsheetId = firstUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];

        if (!spreadsheetId) {
             throw new Error("❌ Could not determine Spreadsheet ID from url-sheet.json.");
        }

        const auth = await this.getAuth().getClient();
        const sheets = google.sheets({ version: 'v4', auth });

        console.log(`📡 Authenticated Pull for '${projectName}' (ID: ${spreadsheetId})...`);

        // 1. Get Spreadsheet Metadata to find all tabs
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const tabs = meta.data.sheets.map(s => s.properties.title);

        this.backupData(paths.siteDir, paths.dataDir);

        // 2. Load schema to use for mapping (if available)
        let mapper = { mapHeader: (k) => k, mapValue: (v) => v };
        const schemaPath = fs.existsSync(path.join(paths.dataDir, 'schema.json')) 
            ? path.join(paths.dataDir, 'schema.json') 
            : path.join(paths.dataDir, '_schema.json');
        
        if (fs.existsSync(schemaPath)) {
            try {
                const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
                const { createMapper } = await import('./mapper.js'); 
                mapper = createMapper(schema);
            } catch (e) { console.warn("⚠️ Could not load schema for mapping, using raw headers."); }
        }

        // 3. Batch Get all values
        const ranges = tabs.map(t => `${t}!A1:Z1000`);
        const res = await sheets.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges
        });

        const valueRanges = res.data.valueRanges || [];
        for (let i = 0; i < tabs.length; i++) {
            const tabName = tabs[i];
            const rows = valueRanges[i].values;
            if (!rows || rows.length < 1) continue;

            const headers = rows[0];
            const dataRows = rows.slice(1);

            const json = dataRows.map(row => {
                const obj = {};
                headers.forEach((header, idx) => {
                    if (!header) return;
                    const techKey = mapper.mapHeader(header);
                    let val = row[idx] !== undefined ? row[idx] : "";
                    
                    if (typeof val === 'string') {
                        val = mapper.mapValue(val);
                        val = val.replace(/<br\s*\/?>/gi, '\n').trim();
                    }
                    obj[techKey] = val;
                });
                return obj;
            }).filter(row => Object.values(row).some(v => v !== ""));

            let filename = `${tabName.toLowerCase()}.json`;
            if (tabName === '_style_config') filename = 'style_config.json';
            if (tabName === '_links_config') filename = 'links_config.json';
            
            const destPath = path.join(paths.dataDir, filename);
            fs.writeFileSync(destPath, JSON.stringify(json, null, 2));
            console.log(`  ✅ ${tabName} synced -> ${filename}`);
        }

        console.log(`\n🎉 Authenticated Data Sync Complete!`);
    }

    /**
     * Pull data from Sheet to a temporary directory for safety/comparison
     */
    async pullToTemp(projectName) {
        const paths = this.resolvePaths(projectName);
        if (!fs.existsSync(paths.siteDir)) throw new Error(`Site directory not found for ${projectName}`);

        console.log(`🚀 Fetching data to temp for '${projectName}'...`);
        // We use -- --temp to pass the flag THROUGH pnpm to the underlying script
        execSync('pnpm fetch-data -- --temp', { cwd: paths.siteDir, stdio: 'inherit' });
    }

    /**
     * Sync TSV to JSON
     */
    async syncTSVToJSON(projectName) {
        const paths = this.resolvePaths(projectName);
        if (!fs.existsSync(paths.tsvDir)) throw new Error(`TSV source not found: ${paths.tsvDir}`);

        console.log(`🔄 Injecting TSV data for: '${projectName}'`);
        const files = fs.readdirSync(paths.tsvDir).filter(f => f.endsWith('.tsv'));

        if (files.length === 0) {
             console.warn(`⚠️ No .tsv files found in ${paths.tsvDir}`);
             return;
        }

        for (const file of files) {
            const tsvPath = path.join(paths.tsvDir, file);
            const json = await csv({ delimiter: '\t', checkType: true }).fromFile(tsvPath);
            
            const cleaned = json.map(row => {
                const newRow = {};
                Object.keys(row).forEach(key => {
                    let val = row[key];
                    if (typeof val === 'string') {
                        val = val.replace(/<br>/gi, '\n').trim();
                    }
                    newRow[key] = val;
                });
                return newRow;
            });

            const destPath = path.join(paths.dataDir, file.replace('.tsv', '.json').toLowerCase());
            this.saveJSON(destPath, cleaned);
            
             // Extra check on file size
            const stats = fs.statSync(destPath);
            if (stats.size < 5) {
                console.warn(`⚠️  WARNING: ${path.basename(destPath)} is suspiciously small (${stats.size} bytes).`);
            } else {
                console.log(`  ✅ Injected: ${path.basename(destPath)}`);
            }
        }
        console.log(`\n🎉 Data Sync Complete!`);
    }

    /**
     * Ensure hidden configuration tabs exist in the Google Sheet
     */
    async ensureHiddenTabs(sheets, spreadsheetId, currentConfig, settingsPath) {
        let changed = false;
        const hiddenTabs = ["_style_config", "_links_config"];
        const newConfig = { ...currentConfig };

        for (const tabName of hiddenTabs) {
            if (newConfig[tabName]) continue;

            console.log(`  🎨 '${tabName}' tab missing in config. Checking/Creating...`);
            try {
                const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
                let targetSheet = sheetMeta.data.sheets.find(s => s.properties.title === tabName);
                let newSheetId;

                if (!targetSheet) {
                    const addRes = await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: {
                            requests: [{
                                addSheet: {
                                    properties: {
                                        title: tabName,
                                        hidden: true,
                                        gridProperties: { rowCount: 1000, columnCount: 2 } // Simple key-value structure
                                    }
                                }
                            }]
                        }
                    });
                    newSheetId = addRes.data.replies[0].addSheet.properties.sheetId;
                    console.log(`  ✅ Tab '${tabName}' created (GID: ${newSheetId}).`);
                } else {
                    newSheetId = targetSheet.properties.sheetId;
                    console.log(`  ℹ️ Tab '${tabName}' already existed (GID: ${newSheetId}).`);
                }

                const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
                newConfig[tabName] = {
                    editUrl: `${baseUrl}/edit#gid=${newSheetId}`,
                    exportUrl: `${baseUrl}/export?format=tsv&gid=${newSheetId}`
                };
                changed = true;
            } catch (e) {
                console.error(`  ❌ Could not process '${tabName}': ${e.message}`);
            }
        }

        if (changed) {
            fs.writeFileSync(settingsPath, JSON.stringify(newConfig, null, 2));
            console.log("  📝 url-sheet.json updated.");
        }
        return newConfig;
    }

    /**
     * Migrate old site_settings.json to split content and style
     */
    migrateSettings(dataDir) {
        const settingsJsonPath = path.join(dataDir, 'site_settings.json');
        const styleJsonPath = path.join(dataDir, 'style_config.json');

        if (fs.existsSync(settingsJsonPath) && !fs.existsSync(styleJsonPath)) {
            console.log("  🧹 Migration: Splitting old 'site_settings.json' into Content & Style...");
            try {
                const raw = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf8'));
                const data = Array.isArray(raw) ? raw[0] : raw;
                
                const content = {};
                const style = {};
                
                Object.keys(data).forEach(k => {
                    if (k.match(/^(light_|dark_|hero_|font_|color_|btn_|card_|section_|footer_bg|nav_|rounded_|shadow_)/)) {
                        style[k] = data[k];
                    } else {
                        content[k] = data[k];
                    }
                });

                // Write split files
                fs.writeFileSync(settingsJsonPath, JSON.stringify([content], null, 2));
                fs.writeFileSync(styleJsonPath, JSON.stringify([style], null, 2));
                console.log("  ✅ Successfully split: style_config.json created.");
            } catch (e) {
                console.error("  ❌ Migration failed:", e.message);
            }
        }
    }

    /**
     * Check if the Google Sheet has been modified more recently than the local JSON.
     */
    async checkSheetDrift(projectName) {
        const paths = this.resolvePaths(projectName);
        const sheetFile = path.join(paths.settingsDir, 'url-sheet.json');

        if (!fs.existsSync(sheetFile)) return { hasDrift: false, reason: "No sheet linked" };

        try {
            const sheetConfig = JSON.parse(fs.readFileSync(sheetFile, 'utf8'));
            const sheetId = Object.keys(sheetConfig)[0];
            if (!sheetId) return { hasDrift: false, reason: "Invalid sheet config" };

            const auth = this.getAuth();
            const drive = google.drive({ version: 'v3', auth });

            const driveFile = await drive.files.get({
                fileId: sheetId,
                fields: 'modifiedTime'
            });

            const sheetMtime = new Date(driveFile.data.modifiedTime);

            // Check local mtime of site_settings.json
            const localSettingsPath = path.join(paths.dataDir, 'site_settings.json');
            if (!fs.existsSync(localSettingsPath)) return { hasDrift: true, reason: "Local settings missing" };

            const localMtime = fs.statSync(localSettingsPath).mtime;

            const driftMs = sheetMtime.getTime() - localMtime.getTime();
            const hasDrift = driftMs > 5000; // Allow 5 seconds buffer

            return {
                hasDrift,
                sheetMtime: sheetMtime.toISOString(),
                localMtime: localMtime.toISOString(),
                driftSeconds: Math.floor(driftMs / 1000)
            };

        } catch (e) {
            return { hasDrift: false, error: e.message };
        }
    }

    /**
     * Patch a specific key in a JSON file
     */

    patchData(projectName, file, index, key, value) {
        const paths = this.resolvePaths(projectName);
        const fileName = file.endsWith('.json') ? file : `${file}.json`;
        const filePath = path.join(paths.dataDir, fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Bestand ${fileName} niet gevonden in project ${projectName}`);
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (Array.isArray(data)) {
            if (!data[index]) data[index] = {};
            data[index][key] = value;
        } else {
            // Voor site_settings.json of andere object-gebaseerde configs
            const keys = key.split('.');
            let obj = data;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!obj[keys[i]]) obj[keys[i]] = {};
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Patched ${file} -> ${key}: ${value}`);
        return true;
    }

    /**
     * Helper to extract primitive values from objects before sheet sync.
     * Prevents "struct_value" errors in Google Sheets API.
     */
    _flattenForSheet(value) {
        if (value === null || value === undefined) return "";
        if (typeof value === 'object' && !Array.isArray(value)) {
            // Extract common CMS object properties
            if (value.text !== undefined) return value.text;
            if (value.title !== undefined) return value.title;
            if (value.label !== undefined) return value.label;
            if (value.url !== undefined) return value.url;
            
            // Fallback to stringification for unknown objects
            return JSON.stringify(value);
        }
        return value;
    }

    /**
     * Sync local JSON data back to Google Sheet
     */
    async syncToSheet(projectName) {
        const paths = this.resolvePaths(projectName);
        if (!fs.existsSync(paths.siteDir)) {
             throw new Error(`Site directory not found for ${projectName}`);
        }

        const settingsPath = path.join(paths.settingsDir, 'url-sheet.json');
        if (!fs.existsSync(settingsPath)) {
             throw new Error("❌ No url-sheet.json found for this project.");
        }

        const urlConfig = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        // Get Spreadsheet ID from the first editUrl
        const firstUrl = (urlConfig._system || Object.values(urlConfig)[0]).editUrl;
        const spreadsheetId = firstUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];

        if (!spreadsheetId) {
             throw new Error("❌ Could not determine Spreadsheet ID from url-sheet.json.");
        }

        const auth = this.getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // --- 1. LOCAL MIGRATION (SPLIT MIXED DATA) ---
        this.migrateSettings(paths.dataDir);

        // --- 2. DETECT ALL LOCAL JSON FILES ---
        const jsonFiles = fs.readdirSync(paths.dataDir).filter(f => 
            f.endsWith('.json') && 
            !f.startsWith('display_config') && 
            !f.startsWith('layout_settings') && 
            !f.startsWith('section_settings') &&
            !f.startsWith('section_order') &&
            !f.startsWith('schema') &&
            !f.startsWith('all_data')
        );

        console.log(`🔍 Detected ${jsonFiles.length} tables to sync.`);

        // --- 2b. LOAD LANGUAGE CONTROLLER ---
        let langCtrl = null;
        try {
            const { LanguageController } = await import('../controllers/LanguageController.js');
            langCtrl = new LanguageController(new (await import('./ConfigManager.js')).AthenaConfigManager(this.root));
        } catch (e) { console.warn("⚠️ LanguageController not available for sync."); }

        // --- 3. UPLOAD LOOP ---
        for (const fileName of jsonFiles) {
            let tabName = fileName.replace('.json', '');
            
            // Skip translation files directly, they are merged via the controller
            if (tabName.includes('_')) continue;

            // Special mapping for system files
            if (fileName === 'style_config.json') tabName = '_style_config';
            if (fileName === 'links_config.json') tabName = '_links_config';
            
            const jsonPath = path.join(paths.dataDir, fileName);
            let jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // --- 3b. MERGE TRANSLATIONS IF AVAILABLE ---
            if (langCtrl) {
                const merged = langCtrl.getMergedDataForSheet(projectName, tabName);
                if (merged) jsonData = merged;
            }

            // Ensure all links are modern
            jsonData = this.deepFixLinks(jsonData);

            // Ensure tab exists in Google Sheet and url-sheet.json
            if (!urlConfig[tabName]) {
                console.log(`  🆕 New table detected: '${tabName}'. Creating tab...`);
                try {
                    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
                    let targetSheet = sheetMeta.data.sheets.find(s => s.properties.title === tabName);
                    let newSheetId;

                    if (!targetSheet) {
                        const addRes = await sheets.spreadsheets.batchUpdate({
                            spreadsheetId,
                            requestBody: {
                                requests: [{
                                    addSheet: {
                                        properties: {
                                            title: tabName,
                                            gridProperties: { rowCount: 1000, columnCount: 20 }
                                        }
                                    }
                                }]
                            }
                        });
                        newSheetId = addRes.data.replies[0].addSheet.properties.sheetId;
                        console.log(`  ✅ Tab '${tabName}' created.`);
                    } else {
                        newSheetId = targetSheet.properties.sheetId;
                    }

                    urlConfig[tabName] = {
                        editUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${newSheetId}`,
                        exportUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=tsv&gid=${newSheetId}`
                    };
                    fs.writeFileSync(settingsPath, JSON.stringify(urlConfig, null, 2));
                } catch (e) {
                    console.error(`  ❌ Failed to create tab '${tabName}': ${e.message}`);
                    continue;
                }
            }

            console.log(`  📤 Uploading ${tabName}...`);
            
            // Convert to 2D array for Sheets
            let headers = [];
            let rows = [];

            if (Array.isArray(jsonData)) {
                if (jsonData.length === 0) {
                    // Empty table, just headers if we can guess them
                    headers = ["id", "titel"];
                    rows = [headers];
                } else {
                    headers = Object.keys(jsonData[0]);
                    rows = [headers];
                    jsonData.forEach(item => {
                        rows.push(headers.map(h => this._flattenForSheet(item[h])));
                    });
                }
            } else {
                // Key-value object
                headers = ["Key", "Value"];
                rows = [headers, ...Object.entries(jsonData).map(([k, v]) => [k, this._flattenForSheet(v)])];
            }

            try {
                await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${tabName}'!A1:Z1000` });
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `'${tabName}'!A1`,
                    valueInputOption: 'RAW',
                    requestBody: { values: rows },
                });
                console.log(`  ✅ ${tabName} successfully updated.`);
            } catch (e) {
                console.error(`  ❌ Error uploading ${tabName}: ${e.message}`);
            }
        }

        console.log("✨ Done! The Google Sheet is now fully synchronized with all your local tables.");
    }
}
