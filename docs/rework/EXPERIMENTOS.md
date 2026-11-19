# Experimentos interativos · 19 de novembro de 2026

| Página | Interação | Origem dos valores |
| --- | --- | --- |
| [Home](https://nexoresearch.org/pt#expansao-em-etapas) | Três épocas, reprodução em tempo cósmico, velocidade, diagrama com vetores e volume 3D | Solução de Friedmann para matéria e Λ em geometria plana. A linha ilustrativa de 500 nm é emitida em z = 2. |
| [Atlas](https://nexoresearch.org/pt/data#atlas) | Mapa angular e volume orbital de 1.543 supernovas, corte em redshift, seleção por CID e exportação | Primeira linha de cada CID no arquivo público Pantheon+SH0ES.dat. RA e DEC em graus, z no referencial do CMB. Raio comóvel calculado com Ωₘ = 0,3 e H₀ = 70 km/s/Mpc. |
| [Resultado vivo](https://nexoresearch.org/pt/resultado-vivo) | Plano 2D, superfície BAO, escolha de Ωₘ e H₀, posterior marginal | Vetor e covariância DESI DR2 ALL_GCcomb. Régua fixa em 147,5 Mpc. O cenário sem LRG2 recalcula o mínimo e a posterior. |
| [Dossiê DESI](https://nexoresearch.org/pt/results/t-28160180cded#desi-tracer-exclusion) | Seletor dos sete grupos, variação de Δχ² nas duas compilações e resíduos de 13 medidas BAO | JSON público da reexecução DESI DR2 + DES-SN5YR ou Union3. Os resíduos individuais comparam o vetor BAO às previsões escolhidas e usam a raiz da diagonal da covariância. |
| [Dossiê de supernovas](https://nexoresearch.org/pt/results/t-05ae703af393#expansion-models) e dossiê DESI | Curvas de H(z), distância comóvel, fator de escala em função do tempo de retrospecto e diferença percentual em H(z) | Comparação ilustrativa entre ΛCDM e CPL, com H₀ e Ωₘ compartilhados. A tabela, o CSV e as curvas usam a mesma função. |

Na superfície BAO, a altura é o χ² no ponto escolhido menos o mínimo da mesma seleção. A malha mostra alturas até 10. A tabela calcula também os pontos fora desse recorte. A posterior integra a verossimilhança em H₀ com priors uniformes explícitos em Ωₘ e H₀. O cenário de régua curta mantém seu ponto de síntese em 2D.

## Reprodução e conferência

- A projeção do catálogo usa `python scripts/emit-pantheon-positions.py <Pantheon+SH0ES.dat>`. O script confere o SHA-256 do insumo e as dez contagens de redshift antes da escrita.
- SHA-256 do catálogo de entrada `1cb0fc379ef066afdc2ffd1857681cc478024570d8a3eba284fb645775198cf8`. SHA-256 do CSV público de posições `78edff74af55271df965bdb7fb9e877eb49ac0f1de51484b82cb3b1a170e63ec`.
- A validação local terminou com 50 testes unitários e 234 testes de navegador aprovados em desktop e celular emulado.
- `npm run check` verifica a geometria de cada objeto, as distâncias no limite analítico de Einstein–de Sitter, a relação entre idade cósmica e retrospecto, as alturas dos dois contornos DESI e a normalização das duas posteriores.
- `npm run build` gerou 442 páginas. `npm run scan` verificou a distribuição compilada e os arquivos-fonte.
- No Chromium, as três cenas abriram em WebGL2. O fundo da Home renderizou com GLSL em WebGL2 e com WGSL em WebGPU. O HTML inicial já contém título, navegação e figuras. A vista 3D carrega sob demanda.
- A revisão de 295 px incluiu Home, atlas, Resultado Vivo, catálogo, pesquisa, Publicações e os dossiês de supernovas e DESI. A captura PNG da superfície BAO e o CSV de 1.543 posições foram abertos e conferidos.
- As medições de LCP, INP e CLS usam a implementação de Web Vitals distribuída com o Next.js. Cada execução de `e2e/institute.spec.ts` registra os valores por dispositivo no log da integração contínua.

As faixas de confiança, o contraste da régua curta e a calibração das significâncias seguem os contratos públicos de cada análise. A tabela de energia escura com a restrição w ≥ −1 depende da liberação dos valores por Ωₘ fixo.

## Desempenho da Home

Medianas de três navegações por largura, cada uma em um novo contexto de Chromium 153, no servidor local de produção. As interações foram abrir e fechar a legenda da figura Pantheon+. A cadência abaixo mede callbacks de tela em um segundo.

| Largura | LCP | INP | CLS | Cadência da tela |
| --- | ---: | ---: | ---: | ---: |
| 1.280 px | 340 ms | 72 ms | 0,0226 | 60 Hz |
| 390 px | 484 ms | 72 ms | 0,0007 | 58 Hz |

No desktop com renderização por software, a primeira implementação registrou INP mediano de 296 ms e cadência de 25 Hz. A versão publicada desenha o campo estelar uma vez nesse modo e move a camada no compositor. Em GPU, o shader ajusta a resolução ao tempo de quadro e cede recursos durante a interação. Os experimentos científicos têm renderização própria sob demanda.
