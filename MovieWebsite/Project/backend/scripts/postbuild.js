const fs = require('fs');
const path = require('path');

const distMain = path.join(__dirname, '..', 'dist', 'main.js');
const distSrcDir = path.join(__dirname, '..', 'dist', 'src');
const distSrcMain = path.join(distSrcDir, 'main.js');

if (fs.existsSync(distMain)) {
  fs.mkdirSync(distSrcDir, { recursive: true });
  fs.copyFileSync(distMain, distSrcMain);
  console.log('✅ Mirrored dist/main.js -> dist/src/main.js for Vercel compatibility');
}
