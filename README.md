# River Raid

Recriação independente do River Raid do Atari 2600, pronta para GitHub Pages. Jogo original de Carol Shaw, publicado pela Activision em 1982.

Todo o jogo está em **index.html**: HTML, CSS, gráficos Canvas e áudio sintetizado. Não requer instalação, servidor de aplicação, banco de dados, bibliotecas externas ou conexão depois de carregar. Também pode ser aberto diretamente como arquivo no computador.

## Jogar

1. Clique em **INICIAR** ou pressione **Enter**.
2. Pressione uma seta ou o botão de tiro para decolar.
3. Use **← →** para pilotar, **↑ ↓** para acelerar/desacelerar e **Espaço** para atirar.
4. Sobrevoe os depósitos **FUEL** para abastecer; reduza a velocidade para receber mais combustível.

**P / Esc:** pausa. **M:** som. **F:** tela cheia. **Enter:** nova partida.

Celular: direcional e botão de tiro na tela, com suporte a múltiplos toques. Controle USB/Bluetooth: direcional, botão principal e Start, quando suportado pelo navegador. O som começa após uma interação; tela cheia depende do suporte do navegador.

Antes de iniciar, escolha um ou dois jogadores. Dois jogadores alternam quando um avião é perdido. Os seletores ficam bloqueados durante a partida. Recordes são locais ao navegador e separados por dificuldade; se o armazenamento estiver bloqueado, o jogo continua funcionando sem persistir o recorde.

## Regras reproduzidas

- Avião ativo e três reservas; reserva extra a cada 10.000 pontos, até nove.
- Navio: 30 pontos; helicóptero: 60; depósito: 80; jato: 100; ponte: 500.
- Um míssil por vez; segure o botão para repetir os disparos.
- Dificuldade **B** permite direcionar o míssil após o disparo; **A** mantém o tiro reto.
- Combustível consumido com o tempo, independentemente da velocidade.
- Depósitos podem ser destruídos; pontes destruídas definem o ponto de reinício.
- Rotas repetíveis, ilhas, canais estreitos e menos depósitos nos trechos avançados.

## Fidelidade

O objetivo é reproduzir a aparência e as regras do Atari 2600: rio azul, margens verdes, avião amarelo, gráficos de baixa resolução e painel inferior. Esta é uma **reimplementação**, não um emulador: não contém ROM nem o código do cartucho. O traçado dos mapas, as formas dos sprites, os tempos e a síntese de áudio foram reconstruídos e não são idênticos bit a bit ao jogo original.

As regras foram conferidas no [manual original arquivado no AtariAge](https://atariage.com/manual_html_page.php?SoftwareLabelID=409). A recriação não é afiliada à Activision ou à Atari.

## GitHub Pages

Em **Settings → Pages**, selecione:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/ (root)**

Salve. O arquivo `.nojekyll` permite servir o projeto diretamente, sem processamento de Jekyll. Após a publicação, a própria tela do Pages informa o endereço do jogo. Commits posteriores na `main` atualizam o site automaticamente.

[Documentação oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Verificação

Com Node.js 20 ou superior, execute:

```sh
node --test tests/game.test.cjs
```

Os testes cobrem as regras, geração de terreno, reinício, pausa, tiros, combustível e a integração dos controles com um DOM simulado. Essa integração não substitui uma sessão de jogo em navegador real.

O código pode ser editado diretamente nos três blocos `engine`, `renderer` e `app` ao final do HTML. Não há etapa de build.
