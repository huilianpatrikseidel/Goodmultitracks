# ⚡ Quick Start - 2 Minutos

## 🎯 Ação Única Necessária

```
ARQUIVO: features/player/components/DAWPlayer.tsx

AÇÃO: Buscar e Substituir

BUSCAR:     '#404040'
SUBSTITUIR: 'var(--daw-control)'

RESULTADO: 3 occurrences replaced

STATUS: ✅ PRONTO!
```

---

## 🔧 Como Fazer

### No VS Code
1. `Ctrl+H` (ou `Cmd+H` no Mac)
2. Buscar: `'#404040'`
3. Substituir: `'var(--daw-control)'`
4. Click "Replace All"
5. `Ctrl+S` para salvar

### Na Linha de Comando
```bash
# PowerShell (Windows)
(Get-Content features/player/components/DAWPlayer.tsx) -replace "'#404040'", "'var(--daw-control)'" | Set-Content features/player/components/DAWPlayer.tsx

# Bash (Mac/Linux)
sed -i "s/'#404040'/'var(--daw-control)'/g" features/player/components/DAWPlayer.tsx
```

### Com Python
```bash
python fix-all-colors.py
```

---

## ✅ Verificação

```bash
# Não deve retornar nada
grep "#404040" features/player/components/DAWPlayer.tsx
```

---

## 🎉 Pronto!

**Tempo:** 2 minutos
**Resultado:** Cores padronizadas
**Próximo:** Teste a app

---

## 📚 Documentação Completa

Para mais detalhes:

- 🇧🇷 **[LEIA-ME.md](./LEIA-ME.md)** - Em Português
- 📖 **[REFACTORING_COMPLETE.md](./REFACTORING_COMPLETE.md)** - Visão completa
- 🎓 **[STEP_BY_STEP_GUIDE.md](./STEP_BY_STEP_GUIDE.md)** - Passo a passo
- 📑 **[INDEX.md](./INDEX.md)** - Índice de tudo

---

**Status:** ⚠️ 3 substituições pendentes
**Tempo:** ⏱️ 2 minutos
**Ação:** 👉 Faça agora!
