const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pkg = require('./package.json');

/**
 * Build script to generate PharmaFlow IMS setup
 * Usage: node build-setups.cjs
 */

function updateMetadata() {
    const metadataPath = path.join(__dirname, 'setup-metadata.json');
    const metadata = {
        setupType: 'STANDARD',
        setupId: generateUUID(),
        version: pkg.version,
        buildDate: new Date().toISOString()
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`✓ Updated setup-metadata.json`);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function buildSetup() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Building PharmaFlow IMS Setup`);
    console.log('='.repeat(60));

    // Update metadata
    updateMetadata();

    try {
        // Run build
        console.log('\n📦 Running Vite build...');
        execSync('npm run build', { stdio: 'inherit' });

        console.log('\n🔨 Running Electron Builder...');
        execSync('npx electron-builder', { stdio: 'inherit' });
    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }

    // List the output file
    console.log(`\n✅ Setup created in dist-electron/`);
}

// Main execution
console.log('PharmaFlow IMS - Setup Builder');
console.log('==============================\n');

buildSetup();

console.log('\n' + '='.repeat(60));
console.log('✅ Build Complete!');
console.log('='.repeat(60));
console.log('');
