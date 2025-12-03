#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para corrigir o desalinhamento vertical entre Sidebar e Timeline
substituindo todas as ocorrências de currentTracks por orderedTracks
"""

import re

# Ler o arquivo
with open('features/player/components/DAWPlayer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir todas as ocorrências de currentTracks por orderedTracks
content = content.replace('tracks={currentTracks}', 'tracks={orderedTracks}')
content = content.replace('filteredTracks={currentTracks}', 'filteredTracks={orderedTracks}')

# Escrever de volta
with open('features/player/components/DAWPlayer.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("✅ DAWPlayer.tsx atualizado com sucesso!")
print("   - Todas as ocorrências de 'currentTracks' foram substituídas por 'orderedTracks'")
