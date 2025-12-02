#!/usr/bin/env python3
# Script temporário para adicionar BetaWarningBanner ao DAWPlayer.tsx

import sys

# Ler o arquivo preservando line endings
with open('/features/player/components/DAWPlayer.tsx', 'r', newline='') as f:
    lines = f.readlines()

# Adicionar import na linha 50 (índice 49)
if 'BetaWarningBanner' not in lines[49]:
    lines.insert(50, "import { BetaWarningBanner } from './BetaWarningBanner';\r\n")
    print("✓ Import adicionado na linha 50")
else:
    print("✓ Import já existe")

# Adicionar componente após linha 1018 (agora 1019 devido ao import adicionado)
insert_pos = None
for i, line in enumerate(lines):
    if 'onToolChange={handleToolChange}' in line and i > 1000:
        # Encontrou a linha, adicionar após o fechamento do TransportHeader (2 linhas depois)
        insert_pos = i + 2
        break

if insert_pos:
    # Verificar se já existe
    if 'BetaWarningBanner' not in ''.join(lines[insert_pos:insert_pos+5]):
        lines.insert(insert_pos, '\r\n')
        lines.insert(insert_pos + 1, '          {/* Beta Warning Banner */}\r\n')
        lines.insert(insert_pos + 2, '          <BetaWarningBanner />\r\n')
        print(f"✓ BetaWarningBanner adicionado na linha {insert_pos + 1}")
    else:
        print("✓ BetaWarningBanner já existe")
else:
    print("⚠ Posição para BetaWarningBanner não encontrada")

# Salvar de volta
with open('/features/player/components/DAWPlayer.tsx', 'w', newline='') as f:
    f.writelines(lines)

print("\n✅ Arquivo atualizado com sucesso!")
