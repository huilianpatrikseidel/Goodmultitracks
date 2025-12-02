// Node.js script to fix DAWPlayer.tsx imports
const fs = require('fs');

const filePath = './features/player/components/DAWPlayer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add BetaWarningBanner import after TransportHeader
const oldLine = "import { TransportHeader } from './player/TransportHeader';\r\n";
const newLines = "import { TransportHeader } from './player/TransportHeader';\r\nimport { BetaWarningBanner } from './BetaWarningBanner';\r\n";

content = content.replace(oldLine, newLines);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Added BetaWarningBanner import');
