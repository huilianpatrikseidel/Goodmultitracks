const fs = require('fs');

// Read the entire file
let content = fs.readFileSync('/features/player/components/DAWPlayer.tsx', 'utf8');

// Check if already integrated
if (content.includes("import { BetaWarningBanner }")) {
  console.log('⚠️  BetaWarningBanner import already exists!');
} else {
  // Add import - find the line and add after it
  const lines = content.split('\n');
  let importAdded = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("import { TransportHeader } from './player/TransportHeader'")) {
      // Insert new line after this one
      lines.splice(i + 1, 0, "import { BetaWarningBanner } from './BetaWarningBanner';");
      importAdded = true;
      console.log('✅ Import added at line', i + 2);
      break;
    }
  }
  
  if (!importAdded) {
    console.log('❌ Could not find TransportHeader import');
    process.exit(1);
  }
  
  content = lines.join('\n');
}

// Check if component already added
if (content.match(/<BetaWarningBanner\s*\/>/)) {
  console.log('⚠️  <BetaWarningBanner /> component already exists!');
} else {
  // Add component after TransportHeader closing
  const lines = content.split('\n');
  let componentAdded = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('onToolChange={handleToolChange}')) {
      // Find the closing /> on the next lines
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].trim() === '/>') {
          // Insert after this line, with proper indentation
          lines.splice(j + 2, 0, '          <BetaWarningBanner />');
          componentAdded = true;
          console.log('✅ Component added at line', j + 3);
          break;
        }
      }
      if (componentAdded) break;
    }
  }
  
  if (!componentAdded) {
    console.log('❌ Could not find TransportHeader closing');
    process.exit(1);
  }
  
  content = lines.join('\n');
}

// Write back
fs.writeFileSync('/features/player/components/DAWPlayer.tsx', content, 'utf8');

console.log('\n🎉 Integration complete!');
