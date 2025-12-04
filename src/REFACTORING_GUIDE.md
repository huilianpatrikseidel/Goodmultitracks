# Guia de Refatoração do DAWPlayer.tsx

## Status Atual

✅ **Componentes modulares criados** em `/features/player/components/daw/`:
- `DAWHeader.tsx` - Cabeçalho com controles de transporte
- `DAWWorkspace.tsx` - Área principal com réguas e timeline
- `DAWFooter.tsx` - Rodapé com controles de zoom e navegação
- `TimelineNavigator.tsx` - Navegador de timeline (range slider)

## Pendências

### 1. Substituições de Cor (3 ocorrências)

As seguintes linhas no `/features/player/components/DAWPlayer.tsx` ainda usam `'#404040'` e precisam ser alteradas para `'var(--daw-control)'`:

#### Linha 1200 - Botão "Fit to View"
```tsx
// ANTES:
style={{ backgroundColor: '#404040', color: '#F1F1F1' }}

// DEPOIS:
style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
```

#### Linha 1228 - Botão Toggle Sidebar  
```tsx
// ANTES:
style={{ backgroundColor: '#404040', color: '#F1F1F1' }}

// DEPOIS:
style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
```

#### Linha 1306 - Botão "Performance Mode"
```tsx
// ANTES:
style={{ backgroundColor: '#404040', color: '#F1F1F1' }}

// DEPOIS:
style={{ backgroundColor: 'var(--daw-control)', color: '#F1F1F1' }}
```

### 2. Integração dos Componentes Modulares (Opcional)

Os componentes foram criados mas ainda não estão integrados no DAWPlayer.tsx. Para integrar:

1. **Importar os componentes:**
```tsx
import { DAWHeader } from './daw/DAWHeader';
import { DAWWorkspace } from './daw/DAWWorkspace';
import { DAWFooter } from './daw/DAWFooter';
```

2. **Substituir o JSX correspondente** no DAWPlayerContent pelo uso dos componentes.

3. **Passar as props necessárias** conforme as interfaces definidas em cada componente.

## Script de Automação

Um script Python foi criado em `/scripts/fix-daw-colors.py` que pode fazer as 3 substituições automaticamente:

```bash
python scripts/fix-daw-colors.py
```

## Verificação

Após as alterações, verifique que:
- [ ] Não há mais ocorrências de `backgroundColor: '#404040'` no DAWPlayer.tsx
- [ ] Todos os botões nas barras de ferramentas usam `var(--daw-control)`
- [ ] O esquema de cores está consistente em toda a aplicação

## Variáveis CSS Disponíveis

```css
--daw-bg-main: #171717       /* Fundo principal */
--daw-bg-contrast: #1E1E1E   /* Fundo de contraste */
--daw-bg-bars: #2B2B2B       /* Barras/cards */
--daw-control: #404040       /* Controles (botões, sliders) */
--daw-border: #333333        /* Bordas */
--daw-text-primary: #F1F1F1  /* Texto principal */
```

## Observações

- Os componentes DAWHeader, DAWWorkspace e DAWFooter já estão usando as variáveis CSS corretas
- A integração completa é opcional e pode ser feita gradualmente
- O arquivo atual DAWPlayer.tsx já funciona, apenas precisa das 3 substituições de cor
