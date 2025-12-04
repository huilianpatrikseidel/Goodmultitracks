# Instruções para Correção Manual das Cores

## Problema
Devido aos caracteres de quebra de linha Windows (\r\n) no arquivo, as ferramentas automatizadas não conseguem fazer as substituições. A correção manual é simples e rápida.

## Solução Rápida (< 2 minutos)

### Opção 1: Buscar e Substituir no Editor (RECOMENDADO)

1. Abra o arquivo `/features/player/components/DAWPlayer.tsx` no seu editor
2. Pressione `Ctrl+H` (Windows/Linux) ou `Cmd+H` (Mac)
3. **Buscar:** `'#404040'`
4. **Substituir por:** `'var(--daw-control)'`
5. Clique em "Substituir Tudo" ou revise cada uma das 3 ocorrências
6. Salve o arquivo

### Opção 2: Edição Manual Linha por Linha

Edite o arquivo `/features/player/components/DAWPlayer.tsx` nas seguintes linhas:

**Linha 1200:**
```tsx
// ANTES:
style={{ backgroundColor: '#404040', color: '#F1F1F1' }}

// DEPOIS:
style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
```

**Linha 1228:**
```tsx
// ANTES:
style={{ backgroundColor: '#404040', color: '#F1F1F1' }}

// DEPOIS:
style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
```

**Linha 1306:**
```tsx
// ANTES:
style={{ backgroundColor: '#404040', color: '#F1F1F1' }}

// DEPOIS:
style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
```

### Opção 3: Linha de Comando (Terminal)

Se você tiver acesso ao terminal com ferramentas Unix:

```bash
# No diretório raiz do projeto
sed -i "s/'#404040'/'var(--daw-control)'/g" features/player/components/DAWPlayer.tsx
```

Ou no PowerShell (Windows):
```powershell
(Get-Content features/player/components/DAWPlayer.tsx) -replace "'#404040'", "'var(--daw-control)'" | Set-Content features/player/components/DAWPlayer.tsx
```

## Arquivos Adicionais (Opcional)

Após corrigir o DAWPlayer.tsx, você pode opcionalmente padronizar outros arquivos:

### `/components/PlaybackControls.tsx` (3 ocorrências)
- Linha 117, 182, 223
- Mesmo padrão: `'#404040'` → `'var(--daw-control)'`

### `/components/TrackTagSelector.tsx` (1 ocorrência)
- Linha 49
- Mesmo padrão: `'#404040'` → `'var(--daw-control)'`

## Verificação

Após fazer as mudanças:

```bash
# Verificar que não há mais #404040 no DAWPlayer
grep "#404040" features/player/components/DAWPlayer.tsx

# Deve retornar vazio
```

Ou simplesmente abra a aplicação e verifique que todos os botões aparecem corretamente com a cor de fundo consistente.

## Por que isso aconteceu?

O arquivo foi criado no Windows e usa `\r\n` (CRLF) como quebra de linha ao invés de `\n` (LF) que é o padrão Unix. As ferramentas de edição automatizada não conseguem fazer o parse correto do arquivo com essa codificação.

## Próximos Passos

Após a correção:
1. ✅ Testar a aplicação visualmente
2. ✅ Fazer commit das alterações
3. ✅ (Opcional) Converter o arquivo para LF: use "Change End of Line Sequence" no VS Code
4. ✅ (Opcional) Integrar os componentes modulares criados
