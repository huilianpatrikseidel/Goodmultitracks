# Instruções de Integração do BetaWarningBanner

## Problema
O arquivo `/features/player/components/DAWPlayer.tsx` está usando line endings CRLF (Windows), o que impede a edição automática.

## Solução Manual

### 1. Adicionar Import (Linha 50)

Abra o arquivo `/features/player/components/DAWPlayer.tsx` e adicione a seguinte linha após a linha 49:

**Após esta linha:**
```typescript
import { TrackListSidebar } from '../../../components/TrackListSidebar';
```

**Adicione:**
```typescript
import { BetaWarningBanner } from './BetaWarningBanner';
```

### 2. Adicionar Componente (Linha 1019)

Localize a linha que contém:
```typescript
          />

          {/* Main Content Area */}
```

**Adicione o banner logo após o `/>` e antes do comentário `{/* Main Content Area */}`:**

```typescript
          />

          {/* Beta Warning Banner */}
          <BetaWarningBanner />

          {/* Main Content Area */}
```

## Limpeza de Arquivos Duplicados

Execute estes comandos ou delete manualmente os arquivos duplicados em `/components/ui/`:

```bash
# Procure por arquivos com sufixo -1.tsx e delete-os
# Exemplo: se existir button-1.tsx, delete-o
```

## Verificação

Após fazer as alterações:

1. ✅ O BetaWarningBanner deve aparecer no topo do DAWPlayer
2. ✅ Não deve haver erros de compilação
3. ✅ O banner deve ser dispensável e lembrar essa preferência
4. ✅ Não deve haver arquivos duplicados (*-1.tsx) em /components/ui/

## Conversão de Line Endings (Opcional mas Recomendado)

Para evitar problemas futuros, converta os line endings do DAWPlayer.tsx para LF (Unix):

**VS Code:**
1. Abra o arquivo DAWPlayer.tsx
2. Clique em "CRLF" na barra de status inferior direita
3. Selecione "LF"
4. Salve o arquivo

**Git:**
```bash
git config core.autocrlf input
```

**Linha de comando (Linux/Mac):**
```bash
dos2unix /features/player/components/DAWPlayer.tsx
```
