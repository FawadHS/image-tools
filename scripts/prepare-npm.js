// Script to prepare package for NPM publishing
import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

try {
  // Copy NPM-specific README to dist-lib
  const npmReadme = join(rootDir, 'README.npm.md');
  const distReadme = join(rootDir, 'dist-lib', 'README.md');
  
  if (existsSync(npmReadme)) {
    copyFileSync(npmReadme, distReadme);
    console.log('✓ Copied README.npm.md to dist-lib/README.md');
  }
  
  // Copy LICENSE
  const license = join(rootDir, 'LICENSE');
  const distLicense = join(rootDir, 'dist-lib', 'LICENSE');
  
  if (existsSync(license)) {
    copyFileSync(license, distLicense);
    console.log('✓ Copied LICENSE to dist-lib/');
  }
  
  // Copy CHANGELOG
  const changelog = join(rootDir, 'CHANGELOG.md');
  const distChangelog = join(rootDir, 'dist-lib', 'CHANGELOG.md');
  
  if (existsSync(changelog)) {
    copyFileSync(changelog, distChangelog);
    console.log('✓ Copied CHANGELOG.md to dist-lib/');
  }
  
  console.log('\n✨ Package prepared for publishing!');
  console.log('\nNext steps:');
  console.log('  1. Test locally: npm run pack:test');
  console.log('  2. Publish: npm publish --access public');
  
} catch (error) {
  console.error('Error preparing package:', error);
  process.exit(1);
}
