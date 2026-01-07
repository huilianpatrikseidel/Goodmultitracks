[English](./README.md) | [Português](./README.pt-br.md) | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md) | [Français](./README.fr.md)

# GoodMultitracks

> **Nota:** Este projeto está atualmente em **fase ativa de desenvolvimento (Alpha)**. Funcionalidades podem mudar e instabilidade é esperada. Ainda não há uma versão oficial de lançamento.

O **GoodMultitracks** é um reprodutor de áudio multitrack (stems) projetado com um propósito educacional: **permitir que músicos estudem músicas profundamente usando suas stems.**

Diferente de DAWs tradicionais focadas em produção, o foco aqui é o **aprendizado** e a **análise**. O software utiliza um motor robusto de teoria musical para contextualizar o áudio com informações harmônicas e rítmicas. Serve para bandas, grupos de louvor de igrejas, entre outras aplicações.

## 🎯 Objetivo e Visão

A ideia central é fornecer uma ferramenta onde o músico possa carregar um arquivo multitrack, solar instrumentos/stems, entender a estrutura da música e praticar. Tudo isto, com a possibilidade de uma instalação local, sem custos, sendo um alternativa à plataformas online de streaming de multitracks. Você faz o multitrack, cria um único arquivo que pode ser enviado para a banda, e todos usufruem de uma boa ferramenta de estudos, de forma 100% gratuita e local, sem serviços na nuvem ou telemetria.



* **Atual:** Um leitor de multitracks para estudo, com visualização de formas de onda e análise teórica (acordes, métricas).
* **Futuro Próximo:** Tornar-se um **Player de VS (Virtual Soundcheck/Backing Tracks)** completo para uso ao vivo.


## 🚀 Funcionalidades Principais

### Atuais (Em desenvolvimento)
* **Reprodutor Multitrack (DAW-style):** Controle individual de volume, solo e mute para cada faixa/stem.
* **Inteligência Musical:** Sistema avançado de teoria musical que compreende e processa:
    * Harmonia e Acordes.
    * Métricas e Fórmulas de Compasso (Time Signatures) complexas.
    * Transposição inteligente.
* **Visualização Instrumental:** Diagramas interativos para Guitarra, Piano e Ukulele
* **Gerenciamento de Setlist:** Organização de músicas para estudo ou (futuramente) performance.
* **Ambiente atual:** Execução focada em **Web (navegador)** durante o desenvolvimento.
* **Compilações:** Ainda não estamos trabalhando em compilações/empacotamento (desktop/mobile). 
* **Plataformas previstas:** Alvo multiplataforma — **Desktop (Windows, macOS, Linux)** e **Mobile (Android, iOS)**.

### Roadmap 🗺️
- [ ] Otimização do motor de áudio para baixa latência.
- [ ] Modo "Performance" dedicado para uso como VS Player ao vivo.
- [ ] Melhorias na detecção e sincronia de grades de tempo (Grid).
- [ ] Suporte expandido a formatos de arquivo.
- [ ] Empacotamento multiplataforma (Desktop/Mobile) — Tauri/Capacitor.

## 🛠️ Tecnologias Utilizadas

O projeto é construído sobre uma pilha moderna e performática:

* **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* (Sem empacotadores nativos por enquanto — possivelmente, utilizaremos Tauri/Capacitor)
* **Estilização:** Tailwind CSS.
* **Áudio:** Web Audio API com processamento customizado.

## 💻 Como Executar o Projeto

Como o projeto é Open Source, você pode baixar, estudar o código e rodar na sua máquina.

### Pré-requisitos
* [Node.js](https://nodejs.org/) (Versão 18 ou superior recomendada)
  

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/goodmultitracks.git](https://github.com/seu-usuario/goodmultitracks.git)
    cd goodmultitracks
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Para rodar no navegador (Modo Web):**
    ```bash
    npm run dev
    ```
    Observação: compilações/empacotamento para Desktop/Mobile ainda **não** estão habilitados. Esta etapa será adicionada quando iniciarmos o suporte multiplataforma.
   

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Se você é desenvolvedor (Front-end, TypeScript, ou entende de DSP/Áudio e WebAssembly) ou músico com ideias de funcionalidades:

1.  Faça um Fork do projeto.
2.  Crie uma Branch para sua Feature (`git checkout -b feature/NovaFuncionalidade`).
3.  Faça o Commit (`git commit -m 'Adicionando nova funcionalidade'`).
4.  Faça o Push (`git push origin feature/NovaFuncionalidade`).
5.  Abra um Pull Request.

## 📄 Licença

Licenciado sob **GNU GPL v2.0 (GPL-2.0-only)**. Consulte o arquivo [LICENSE](./LICENSE) para o texto completo.

---
*Desenvolvido com ❤️ por Huilian Patrik Seidel

```