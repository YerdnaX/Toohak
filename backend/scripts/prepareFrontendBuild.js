const fs = require('fs');
const path = require('path');

const rootPath = path.resolve(__dirname, '..', '..');
const sourceDist = path.join(rootPath, 'frontend', 'dist');
const targetPublic = path.join(rootPath, 'backend', 'public');

if (!fs.existsSync(sourceDist)) {
  console.error('No existe frontend/dist. Ejecuta primero: npm run build en frontend.');
  process.exit(1);
}

fs.mkdirSync(targetPublic, { recursive: true });

const entries = fs.readdirSync(targetPublic);
for (const entry of entries) {
  if (entry === '.htaccess') {
    continue;
  }

  const fullPath = path.join(targetPublic, entry);
  fs.rmSync(fullPath, { recursive: true, force: true });
}

fs.cpSync(sourceDist, targetPublic, { recursive: true });

console.log('Frontend copiado a backend/public correctamente.');
