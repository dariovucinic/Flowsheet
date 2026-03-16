const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Starting FlowSheet Build Process...');

const rootDir = __dirname;
const notebookDir = path.join(rootDir, '../engineering-notebook');
const electronDir = rootDir;

try {
    // 1. Build Next.js
    console.log('\n🏗️  Step 1: Building Engineering Notebook (Next.js)...');
    execSync('npm run export', { cwd: notebookDir, stdio: 'inherit' });

    // 2. Install Electron Dependencies (ensure they are up to date)
    console.log('\n🏗️  Step 2: Ensuring Electron dependencies...');
    execSync('npm install', { cwd: electronDir, stdio: 'inherit' });

    // 3. Build Electron App
    console.log('\n🏗️  Step 3: Packaging Electron App...');
    execSync('npm run build', { cwd: electronDir, stdio: 'inherit' });

    console.log('\n✅ Build Complete! Check the "dist" folder.');
} catch (error) {
    console.error('\n❌ Build Failed:', error.message);
    process.exit(1);
}
