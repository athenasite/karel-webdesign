#!/usr/bin/env node

/**
 * Athena 3.0 Freeze Utility
 * 
 * Goal: Decouple a site from the shared factory engine by locally "vending" dependencies.
 * Usage: node factory/6-utilities/freeze-site.cjs <site-path>
 */

const fs = require('fs');
const path = require('path');

const sitePath = process.argv[2];

if (!sitePath) {
  console.error('❌ Please provide a site path (e.g., sites/athena-pro)');
  process.exit(1);
}

const absoluteSitePath = path.resolve(process.cwd(), sitePath);
const engineTargetDir = path.join(absoluteSitePath, 'src/engine');

if (!fs.existsSync(absoluteSitePath)) {
  console.error(`❌ Site path not found: ${absoluteSitePath}`);
  process.exit(1);
}

console.log(`❄️ Freezing site: ${sitePath}`);

// -- STEP 1: Tracing Dependencies --

const dependencies = new Set();
const processedFiles = new Set();

function traceDependencies(filePath) {
  if (processedFiles.has(filePath)) return;
  processedFiles.add(filePath);

  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Match both import ... from and export ... from
  const importRegex = /(?:import|export)\s+.*?\s+from\s+['"](.*?)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Check if it's a factory engine dependency
    if (importPath.includes('../../factory/5-engine/')) {
        const resolvedPath = path.resolve(path.dirname(filePath), importPath);
        dependencies.add(resolvedPath);
        traceDependencies(resolvedPath); // Recursive trace for internal engine deps
    }
  }
}

// Start tracing from main entry points
const entryPoints = [
    path.join(absoluteSitePath, 'src/main.jsx'),
    path.join(absoluteSitePath, 'src/App.jsx'),
    path.join(absoluteSitePath, 'src/dock-connector.js')
];

entryPoints.forEach(entry => {
    if (fs.existsSync(entry)) {
        console.log(`🔍 Tracing from ${path.basename(entry)}...`);
        traceDependencies(entry);
    }
});

console.log(`✅ Found ${dependencies.size} engine dependencies.`);

// -- STEP 2: Vending (Copying) --
if (dependencies.size > 0) {
    if (!fs.existsSync(engineTargetDir)) {
        fs.mkdirSync(engineTargetDir, { recursive: true });
        console.log(`📂 Created ${engineTargetDir}`);
    }

    dependencies.forEach(dep => {
        const fileName = path.basename(dep);
        const targetPath = path.join(engineTargetDir, fileName);
        fs.copyFileSync(dep, targetPath);
        console.log(`📦 Vended: ${fileName}`);
    });
}

// -- STEP 3: Transform vite.config.js --
const viteConfigPath = path.join(absoluteSitePath, 'vite.config.js');
if (fs.existsSync(viteConfigPath)) {
    console.log('🧹 Cleaning vite.config.js...');
    let configContent = fs.readFileSync(viteConfigPath, 'utf8');

    // 1. Remove editor plugin resolution logic
    // Look for anything between editor plugin comment and the start of return
    const pluginLogicRegex = /\/\/.*?editor plugin[\s\S]*?if\s*\(isDev\)\s*\{[\s\S]*?\}\s*(?=return)/g;
    configContent = configContent.replace(pluginLogicRegex, '// [Athena 3.0] Editor plugin logic removed for production stability\n  ');

    // 2. Remove the actual plugin call
    configContent = configContent.replace(/athenaEditorPlugin\s*\?\s*athenaEditorPlugin\(\)\s*:\s*null/g, 'null');

    // 3. Fix base path to be relative (Vault standard)
    // Matches: base: process.env... ? ... : ..., OR base: isDev ? ... : ...,
    configContent = configContent.replace(/base:\s*(?:process\.env\.NODE_ENV|isDev).*?,/g, "base: './', // [Athena 3.0] Forced relative base");

    // 4. Cleanup unused variable
    configContent = configContent.replace(/let athenaEditorPlugin = null;/g, '');

    fs.writeFileSync(viteConfigPath, configContent);
    console.log('✅ vite.config.js cleaned.');
}

// -- STEP 4: Transform package.json --
const packageJsonPath = path.join(absoluteSitePath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    console.log('🧹 Cleaning package.json...');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Remove scripts that rely on the global factory
    const factoryScripts = ['pull-data', 'push-data', 'sync', 'sync-on-demand'];
    if (pkg.scripts) {
        factoryScripts.forEach(s => {
            if (pkg.scripts[s]) {
                delete pkg.scripts[s];
                console.log(`🗑️ Removed script: ${s}`);
            }
        });
        
        // Ensure we have a standard build/dev
        pkg.scripts.build = pkg.scripts.build || "vite build";
        pkg.scripts.preview = pkg.scripts.preview || "vite preview";
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    console.log('✅ package.json cleaned.');
}

console.log('🏁 Freeze Phase 3 (Finalization) complete.');
