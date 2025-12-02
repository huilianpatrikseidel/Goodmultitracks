const fs = require('fs');

const filePath = '/features/player/components/DAWPlayer.tsx';

// Lê o arquivo preservando line endings
const content = fs.readFileSync(filePath, 'utf8');

// Split em linhas preservando os line endings
const lines = content.split(/\r?\n/);

// Encontra a linha com "Main Content Area"
let insertIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Main Content Area */}')) {
    insertIndex = i;
    break;
  }
}

if (insertIndex === -1) {
  console.log('❌ Não foi possível encontrar a linha "Main Content Area"');
  process.exit(1);
}

// Insere as novas linhas ANTES do comentário "Main Content Area"
const bannerLines = [
  '          {/* Beta Warning Banner */}',
  '          <BetaWarningBanner />',
  ''
];

// Insere as linhas
lines.splice(insertIndex, 0, ...bannerLines);

// Junta de volta com CRLF (Windows line endings)
const newContent = lines.join('\r\n');

// Escreve de volta
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ BetaWarningBanner adicionado com sucesso na linha', insertIndex + 1);
console.log('   Componente inserido antes de "Main Content Area"');
