const fs = require('fs');

// Read the file
const content = fs.readFileSync('/features/player/components/DAWPlayer.tsx', 'utf8');

// Split by lines preserving line endings
const lines = content.split('\n');

// Find the line with TransportHeader import (should be around line 48)
let importAdded = false;
let componentAdded = false;

for (let i = 0; i < lines.length; i++) {
  // Add import after TransportHeader import
  if (!importAdded && lines[i].includes("import { TransportHeader } from './player/TransportHeader';")) {
    lines.splice(i + 1, 0, "import { BetaWarningBanner } from './BetaWarningBanner';");
    importAdded = true;
    continue;
  }
  
  // Add component after TransportHeader closing (around line 1018)
  if (!componentAdded && lines[i].includes('onToolChange={handleToolChange}') && lines[i + 1].includes('/>')) {
    // Find the line with just '/>' or '          />'
    let j = i + 1;
    while (j < lines.length && !lines[j].trim().startsWith('/>')) {
      j++;
    }
    // Insert after the '/>' line
    if (j < lines.length) {
      lines.splice(j + 2, 0, '');
      lines.splice(j + 3, 0, '          <BetaWarningBanner />');
      componentAdded = true;
    }
  }
}

// Write back
const newContent = lines.join('\n');
fs.writeFileSync('/features/player/components/DAWPlayer.tsx', newContent, 'utf8');

console.log('Import added:', importAdded);
console.log('Component added:', componentAdded);
