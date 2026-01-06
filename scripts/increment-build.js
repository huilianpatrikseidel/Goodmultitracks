import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildNumberPath = join(__dirname, '..', 'build-number.json');
const versionPath = join(__dirname, '..', 'src', 'version.ts');

// Read current build number
const buildData = JSON.parse(readFileSync(buildNumberPath, 'utf-8'));
const newBuildNumber = buildData.buildNumber + 1;

// Update build-number.json
buildData.buildNumber = newBuildNumber;
writeFileSync(buildNumberPath, JSON.stringify(buildData, null, 2));

// Generate version.ts
const versionContent = `// Auto-generated file - do not edit manually
export const VERSION = '0.0.${newBuildNumber.toString().padStart(5, '0')}';
export const BUILD_NUMBER = ${newBuildNumber};
export const BUILD_DATE = '${new Date().toISOString()}';
`;

writeFileSync(versionPath, versionContent);

console.log(`Build number incremented to: ${newBuildNumber}`);
console.log(`Version: 0.0.${newBuildNumber.toString().padStart(5, '0')}`);
