import fs from 'fs';
import path from 'path';

let total = 0;
let fileCount = 0;

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === 'dist' || f === '.git') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      traverse(full);
    } else if (/\.(js|ts|tsx)$/.test(f)) {
      total += fs.readFileSync(full, 'utf8').split('\n').length;
      fileCount++;
    }
  }
}

traverse('server');
traverse('client/src');
console.log(`Total LOC: ${total} across ${fileCount} files`);
