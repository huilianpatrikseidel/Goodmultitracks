# Sistema de Versionamento Automático

## Visão Geral

O projeto utiliza um sistema de versionamento automático que incrementa o número de build a cada compilação.

## Formato da Versão

- **Formato**: `0.0.XXXXX`
- **XXXXX**: Número de build com 5 dígitos (preenchido com zeros à esquerda)
- **Exemplo**: `0.0.00003`

## Como Funciona

1. **build-number.json**: Armazena o número de build atual
2. **scripts/increment-build.js**: Script que:
   - Lê o número de build atual
   - Incrementa em 1
   - Atualiza `build-number.json`
   - Gera `src/version.ts` com as constantes de versão
3. **src/version.ts**: Arquivo auto-gerado contendo:
   - `VERSION`: String da versão formatada (ex: "0.0.00003")
   - `BUILD_NUMBER`: Número inteiro do build
   - `BUILD_DATE`: Data/hora ISO da compilação

## Uso

### Build Normal (com incremento automático)
```bash
npm run build
```

### Build sem incrementar (para testes)
```bash
npm run build:no-increment
```

### Incrementar manualmente sem build
```bash
node scripts/increment-build.js
```

## Visualização

A versão é exibida na seção "Sobre" do painel de configurações da aplicação, mostrando:
- Versão completa
- Número de build
- Data da compilação

## Notas Importantes

- O arquivo `src/version.ts` é auto-gerado e não deve ser editado manualmente
- Este arquivo está no `.gitignore` e não é versionado no Git
- O número de build é persistido em `build-number.json` e é versionado
- Cada desenvolvedor deve sincronizar o `build-number.json` para manter consistência
