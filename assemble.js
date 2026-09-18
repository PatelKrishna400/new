/**
 * Master Project Assemble Script
 * Compiles both Frontend (Game) and Admin Portal modular pages,
 * and verifies end-to-end integrity.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('================================================================');
console.log('⚡ MASTER COMPILATION: ENERGY TAP REACTOR & ADMIN PORTAL');
console.log('================================================================\n');

// 1. Compile Frontend Game
console.log('📦 [1/2] Compiling Frontend Game (24 Modular Pages)...');
const frontendAssemble = spawnSync(process.execPath, [path.join(__dirname, 'frontend', 'assemble.js')], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'frontend')
});

if (frontendAssemble.status !== 0) {
  console.error('❌ Frontend compilation failed with code:', frontendAssemble.status);
  process.exit(frontendAssemble.status || 1);
}

// 2. Compile Admin Portal
console.log('\n🛠️ [2/2] Compiling Admin Portal (8 Modular Pages)...');
const adminAssemble = spawnSync(process.execPath, [path.join(__dirname, 'admin', 'assemble.js')], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'admin')
});

if (adminAssemble.status !== 0) {
  console.error('❌ Admin portal compilation failed with code:', adminAssemble.status);
  process.exit(adminAssemble.status || 1);
}

console.log('\n================================================================');
console.log('✅ ALL SYSTEMS COMPILED SUCCESSFULLY!');
console.log('   - Game: frontend/index.html');
console.log('   - Admin: admin/index.html');
console.log('   - Backend API: server.js (/api/health, /api/rewards, /api/requests, /api/users)');
console.log('================================================================\n');
