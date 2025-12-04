#!/usr/bin/env python3
"""
Script para substituir as 3 ocorrências de backgroundColor: '#404040' 
por backgroundColor: 'var(--daw-control)' no DAWPlayer.tsx
"""

import re

# Caminho do arquivo
file_path = 'features/player/components/DAWPlayer.tsx'

# Ler o arquivo
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Contar ocorrências antes
before_count = content.count("backgroundColor: '#404040'")
print(f"📊 Encontradas {before_count} ocorrências de backgroundColor: '#404040'")

# Substituir todas as ocorrências
content = content.replace("backgroundColor: '#404040'", "backgroundColor: 'var(--daw-control)'")

# Contar após
after_count = content.count("backgroundColor: 'var(--daw-control)'")

# Escrever de volta
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Substituições concluídas! Agora há {after_count} ocorrências de backgroundColor: 'var(--daw-control)'")
print(f"✅ {before_count} linhas foram atualizadas")
