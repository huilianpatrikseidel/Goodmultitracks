const fs = require('fs');
const path = '/features/player/components/DAWPlayer.tsx';

// Lê o arquivo
const content = fs.readFileSync(path, 'utf8');

// Define o texto a procurar e a substituição
const searchFor = `          />

          {/* Main Content Area */}`;

const replaceWith = `          />

          {/* Beta Warning Banner */}
          <BetaWarningBanner />

          {/* Main Content Area */}`;

// Faz a substituição
const newContent = content.replace(searchFor, replaceWith);

// Verifica se a substituição foi feita
if (content !== newContent) {
  fs.writeFileSync(path, newContent, 'utf8');
  console.log('✅ BetaWarningBanner adicionado com sucesso!');
} else {
  console.log('❌ Não foi possível encontrar o texto para substituir');
  console.log('Procurando por:', JSON.stringify(searchFor));
}
