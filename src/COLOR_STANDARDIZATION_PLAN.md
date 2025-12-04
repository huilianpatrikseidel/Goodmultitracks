# Plano de Padronização de Cores Completo

## Visão Geral
Encontradas **7 ocorrências** de `#404040` em 3 arquivos diferentes que devem ser padronizadas.

## Arquivos Afetados

### 1. `/features/player/components/DAWPlayer.tsx` (3 ocorrências)
**Prioridade: Alta** - Foco principal da refatoração atual

- **Linha 1200**: Botão "Fit to View"
  ```tsx
  style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
  // Substituir por:
  style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
  ```

- **Linha 1228**: Botão Toggle Sidebar
  ```tsx
  style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
  // Substituir por:
  style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
  ```

- **Linha 1306**: Botão "Performance Mode"
  ```tsx
  style={{ backgroundColor: '#404040', color: '#F1F1F1' }}
  // Substituir por:
  style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
  ```

### 2. `/components/PlaybackControls.tsx` (3 ocorrências)
**Prioridade: Média** - Lógica condicional (requer atenção especial)

- **Linha 117**: Botão Reset Tempo
  ```tsx
  backgroundColor: tempo === 100 ? '#3B82F6' : '#404040',
  // Substituir por:
  backgroundColor: tempo === 100 ? '#3B82F6' : 'var(--daw-control)',
  ```

- **Linha 182**: Botão Reset Key Shift
  ```tsx
  backgroundColor: keyShift === 0 ? '#3B82F6' : '#404040',
  // Substituir por:
  backgroundColor: keyShift === 0 ? '#3B82F6' : 'var(--daw-control)',
  ```

- **Linha 223**: Botão Reset Capo
  ```tsx
  backgroundColor: capoFret === 0 ? '#3B82F6' : '#404040',
  // Substituir por:
  backgroundColor: capoFret === 0 ? '#3B82F6' : 'var(--daw-control)',
  ```

### 3. `/components/TrackTagSelector.tsx` (1 ocorrência)
**Prioridade: Baixa** - Componente independente

- **Linha 49**: Botão de Tag
  ```tsx
  backgroundColor: currentTag ? '#404040' : 'transparent',
  // Substituir por:
  backgroundColor: currentTag ? 'var(--daw-control)' : 'transparent',
  ```

## Estratégia de Implementação

### Fase 1: DAWPlayer.tsx (Imediato)
✅ Focar nas 3 ocorrências do arquivo principal
✅ Usar buscar/substituir simples no editor

### Fase 2: PlaybackControls.tsx (Sequencial)  
⏳ Substituir as 3 ocorrências com lógica condicional
⏳ Testar os botões de reset

### Fase 3: TrackTagSelector.tsx (Finalização)
⏳ Substituir a última ocorrência
⏳ Testar o seletor de tags

## Script de Automação Global

Criar script que substitui em todos os arquivos de uma vez:

```python
#!/usr/bin/env python3
"""Padronizar todas as cores #404040 para var(--daw-control)"""

import os
import re

files_to_fix = [
    'features/player/components/DAWPlayer.tsx',
    'components/PlaybackControls.tsx',
    'components/TrackTagSelector.tsx'
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"⚠️  Arquivo não encontrado: {file_path}")
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    before_count = content.count("'#404040'")
    
    # Substituir todas as ocorrências
    content = content.replace("'#404040'", "'var(--daw-control)'")
    
    after_count = content.count("'var(--daw-control)'")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ {file_path}: {before_count} substituições")

print("\n🎉 Padronização completa!")
```

## Verificação

Após todas as substituições, executar:

```bash
# Verificar que não há mais #404040
grep -r "#404040" features/player/components/ components/

# Deve retornar vazio (ou apenas em comentários)
```

## Variáveis CSS

Lembrete do esquema de cores:

```css
--daw-control: #404040       /* Botões e controles */
--daw-bg-main: #171717       /* Fundo principal */
--daw-bg-contrast: #1E1E1E   /* Fundo de contraste */
--daw-bg-bars: #2B2B2B       /* Barras */
--daw-border: #333333        /* Bordas */
--daw-text-primary: #F1F1F1  /* Texto */
```

## Benefícios

✅ Consistência visual em toda a aplicação
✅ Facilita mudanças globais de tema
✅ Manutenção centralizada
✅ Código mais legível e semântico
✅ Melhor experiência do desenvolvedor

## Checklist Final

- [ ] DAWPlayer.tsx - 3 substituições
- [ ] PlaybackControls.tsx - 3 substituições
- [ ] TrackTagSelector.tsx - 1 substituição
- [ ] Executar grep para verificar
- [ ] Testar visualmente cada componente
- [ ] Commit com mensagem descritiva
