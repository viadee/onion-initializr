const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(
  __dirname,
  'dist',
  'node_modules',
  '@onion-initializr',
  'lib',
  'package.json'
);

if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Fix paths - remove 'dist/' prefix
  if (pkg.main) pkg.main = pkg.main.replace(/^dist\//, '');
  if (pkg.types) pkg.types = pkg.types.replace(/^dist\//, '');

  if (pkg.exports) {
    const newExports = {};
    for (const [key, value] of Object.entries(pkg.exports)) {
      newExports[key] = value.replace(/\.\/dist\//g, './');
    }
    pkg.exports = newExports;
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  console.log('✓ Fixed lib package.json exports');
} else {
  console.error('✗ package.json not found at', packageJsonPath);
  process.exit(1);
}
