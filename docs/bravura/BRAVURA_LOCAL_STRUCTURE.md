# Estrutura de Fontes Bravura - Local

## 📂 Estrutura de Diretórios

```
src/
├── fonts/
│   └── bravura/                    # Arquivos da fonte Bravura
│       ├── Bravura.otf            # 500 KB - Fonte principal OpenType
│       ├── Bravura.woff           # 944 KB - Web Font Format
│       ├── BravuraText.otf        # 1.2 MB - Fonte de texto OpenType
│       ├── BravuraText.woff       # 3.9 MB - Texto Web Font
│       ├── LICENSE.txt            # Licença SIL OFL 1.1
│       └── README.md              # Informações sobre a fonte
│
└── assets/
    └── fonts/
        └── bravura-font.css       # Definições @font-face
```

## 🔗 Referências no CSS

O arquivo `src/assets/fonts/bravura-font.css` referencia os arquivos locais:

```css
@font-face {
  font-family: 'Bravura';
  src: url('../../fonts/bravura/Bravura.woff') format('woff'),
       url('../../fonts/bravura/Bravura.otf') format('opentype');
}
```

**Caminho relativo:** `../../fonts/bravura/` 
- Sobe 2 níveis de `src/assets/fonts/` para `src/`
- Então entra em `fonts/bravura/`

## ✅ Vantagens do Armazenamento Local

1. **Offline-first** - Funciona sem conexão à internet
2. **Performance** - Sem latência de CDN externo
3. **Controle de versão** - Versão específica commitada no repositório
4. **Confiabilidade** - Sem dependência de serviços terceiros
5. **Build reproduzível** - Mesmos arquivos em todos os ambientes

## 📦 Tamanho Total

- **Fonte Bravura:** 1.4 MB (OTF + WOFF)
- **Fonte BravuraText:** 5.1 MB (OTF + WOFF)
- **Total:** ~6.5 MB

## 🔄 Atualização da Fonte

Para atualizar a fonte Bravura no futuro:

1. Baixar novos arquivos do repositório oficial:
   https://github.com/steinbergmedia/bravura

2. Substituir arquivos em `src/fonts/bravura/`

3. Atualizar versão no `README.md` e no CSS

## 📝 Licença

Todos os arquivos da fonte estão sob **SIL Open Font License 1.1**
- Uso livre para projetos comerciais e não-comerciais
- Permite modificação e redistribuição
- Veja `src/fonts/bravura/LICENSE.txt` para detalhes completos

## 🎵 Fonte

Repositório oficial: https://github.com/steinbergmedia/bravura
Desenvolvido por: Steinberg Media Technologies GmbH
Versão atual: 1.392 (master branch)
