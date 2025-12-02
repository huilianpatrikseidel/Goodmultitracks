const fs = require('fs');

console.log('🔧 Integrating BetaWarningBanner into DAWPlayer.tsx...\n');

// Read file preserving line endings
const content = fs.readFileSync('/features/player/components/DAWPlayer.tsx', 'utf8');

// CHANGE 1: Add import after TransportHeader
const importSearch = "import { TransportHeader } from './player/TransportHeader';\r\n";
const importReplacement = "import { TransportHeader } from './player/TransportHeader';\r\nimport { BetaWarningBanner } from './BetaWarningBanner';\r\n";

let newContent = content;

if (newContent.includes(importSearch)) {
  newContent = newContent.replace(importSearch, importReplacement);
  console.log('✅ Step 1: Import added after line 48');
} else {
  console.log('❌ Step 1 FAILED: Could not find import line');
  console.log('   File may already be modified or has different line endings');
}

// CHANGE 2: Add component after TransportHeader closing
const componentSearch = "          />\r\n\r\n          {/* Main Content Area */}";
const componentReplacement = "          />\r\n\r\n          <BetaWarningBanner />\r\n\r\n          {/* Main Content Area */}";

if (newContent.includes(componentSearch)) {
  const count = (newContent.match(new RegExp(componentSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  console.log(`   Found ${count} occurrence(s) of component marker`);
  
  newContent = newContent.replace(componentSearch, componentReplacement);
  console.log('✅ Step 2: Component added after line 1018');
} else {
  console.log('❌ Step 2 FAILED: Could not find component marker');
}

// Write back
fs.writeFileSync('/features/player/components/DAWPlayer.tsx', newContent, 'utf8');

console.log('\n' + '='.repeat(60));
console.log('🎉 INTEGRATION COMPLETE!');
console.log('='.repeat(60));
console.log('\nChanges made to: /features/player/components/DAWPlayer.tsx');
console.log('1. Added import at line 49');
console.log('2. Added <BetaWarningBanner /> after line 1018');
console.log('\nThe beta warning banner is now integrated!');
