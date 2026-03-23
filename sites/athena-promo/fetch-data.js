import csv from 'csvtojson';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMapper } from './mapper.js';

// LEES DE BLUEPRINT VAN HET PROJECT
let schemaPath = path.join(process.cwd(), 'src/data/schema.json');
if (!fs.existsSync(schemaPath)) {
    schemaPath = path.join(process.cwd(), 'src/data/_schema.json');
}

let schema;
try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (e) {
    console.error(`❌ CRITICAL: Kan schema niet lezen op pad: ${schemaPath}`);
    process.exit(1);
}

const mapper = createMapper(schema);

async function sync() {
    console.log(`🧹 Athena Deep Clean v6.1 | Blueprint: ${schema.blueprint_name}`);
    
    const settingsPath = path.join(process.cwd(), 'project-settings/url-sheet.json');
    if (!fs.existsSync(settingsPath)) {
        console.error("❌ Geen url-sheet.json gevonden.");
        process.exit(1);
    }
    
    let sources;
    try {
        const fileContent = fs.readFileSync(settingsPath, 'utf8');
        if (!fileContent.trim()) {
             throw new Error("Bestand is leeg");
        }
        sources = JSON.parse(fileContent);
    } catch (e) {
        console.error(`❌ CRITICAL: Kan project-settings/url-sheet.json niet parsen.`);
        console.error(`   Pad: ${settingsPath}`);
        console.error(`   Fout: ${e.message}`);
        process.exit(1);
    }

    for (const [name, config] of Object.entries(sources)) {
        // Support voor zowel string (legacy) als object (hybrid config)
        let url = config;
        if (typeof config === 'object' && config !== null) {
            if (config.exportUrl) {
                url = config.exportUrl;
            } else {
                console.warn(`  ⚠️ Configuratie voor '${name}' is een object, maar mist 'exportUrl'. Sla over.`);
                continue;
            }
        }

        if (!url || !url.startsWith('http')) continue;
        
        try {
            const res = await fetch(url);
            let tsv = await res.text();

            // 🔱 v8.8 SAFETY CHECK: Detect if we hit a Google Login wall (HTML) instead of TSV
            if (tsv.trim().toLowerCase().startsWith('<!doctype html') || tsv.includes('google-signin')) {
                console.error(`  ❌ AUTH ERROR: Kan '${name}' niet downloaden. De Google Sheet is waarschijnlijk niet publiek gedeeld ("Anyone with link can view").`);
                console.warn(`     URL: ${url}`);
                continue;
            }

            let json = await csv({ delimiter: '\t', checkType: true }).fromString(tsv.replace(/^\uFEFF/, ''));

            const cleaned = json.map(row => {
                const newRow = {};
                Object.keys(row).forEach(rawKey => {
                    const techKey = mapper.mapHeader(rawKey);
                    let val = row[rawKey];
                    
                    if (typeof val === 'string') {
                        // Vertaal waarde indien nodig
                        val = mapper.mapValue(val);

                        val = val
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<[^>]*>/g, '')
                            .replace(/###/g, '')
                            .replace(/##/g, '')
                            .replace(/&nbsp;/g, ' ')
                            .trim();
                    }
                    newRow[techKey] = val;
                });
                return newRow;
            }).filter(row => Object.values(row).some(v => v !== ""));

            // HERNOEMING LOGICA: _style_config -> style_config.json
            let filename = `${name.toLowerCase()}.json`;
            let finalData = cleaned;

            if (name === '_style_config') {
                filename = 'style_config.json';
            }
            
            if (name === '_links_config') {
                filename = 'links_config.json';
                // Convert back to object
                finalData = {};
                cleaned.forEach(row => {
                    const k = row.Key || row.key;
                    const v = row.Value || row.value;
                    if (k) finalData[k] = v;
                });
            }

            fs.writeFileSync(path.join(process.cwd(), `src/data/${filename}`), JSON.stringify(finalData, null, 2));
            console.log(`  ✅ ${name} verwerkt -> ${filename}`);
            
        } catch (e) {
            console.error(`  ❌ Fout bij verwerken van ${name}:`, e.message);
        }
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    sync();
}

export { sync };
