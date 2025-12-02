#!/usr/bin/env python3
"""
Script para adicionar o BetaWarningBanner no DAWPlayer.tsx
Lida com line endings CRLF do Windows
"""

# Lê o arquivo
with open('/features/player/components/DAWPlayer.tsx', 'r', encoding='utf-8', newline='') as f:
    content = f.read()

# Procura pela linha do comentário "Main Content Area" e adiciona o banner antes
search_text = "          {/* Main Content Area */}"
banner_component = "\n          {/* Beta Warning Banner */}\n          <BetaWarningBanner />\n\n"

if search_text in content:
    # Adiciona o componente banner antes do comentário Main Content Area
    content = content.replace(search_text, banner_component + search_text)
    
    # Escreve de volta com os mesmos line endings
    with open('/features/player/components/DAWPlayer.tsx', 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    
    print("✅ BetaWarningBanner adicionado com sucesso ao DAWPlayer.tsx")
else:
    print("❌ Não foi possível encontrar o texto de busca")
