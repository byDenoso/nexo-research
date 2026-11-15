# Revisão local dos dois projetos

Este diretório é um painel de revisão, sem integração com deploy.

## Preparação

1. NEXO: `npm ci && npm run build` na raiz deste repositório.
2. Cosmos: `npm ci && npm run build` no diretório `cosmos-do-zero` do checkout TCC.
3. Configure `COSMOS_REVIEW_ROOT` com o caminho absoluto desse diretório. O padrão é `../../cosmos-project/cosmos-do-zero`, relativo a este painel.
4. Neste diretório, execute `npm run dev` e abra `http://127.0.0.1:4173/__review`.

No ambiente gerenciado, o comando equivalente é `sites-preview start /workspace/nexo-research/review`.

O painel inicia um processo Next local, serve o build estático do Cosmos e apresenta ambos na mesma origem. NEXO está em `/pt` e `/en`; Cosmos está em `/`. O seletor dá acesso à pesquisa, catálogo, família, registro e seis aulas, em 1240 ou 390 px.

Para permitir o quadro de revisão, **somente o proxy local** substitui `frame-ancestors 'none'` por `'self'`. Os cabeçalhos do projeto publicado permanecem intactos. Nenhum recurso privado é exposto. Encerrar o painel encerra seu processo Next.

A opção “Aula 1 sem 3D” abre `?visual=diagram`. A entrada de todas as aulas já usa SVG; vistas 3D elegíveis dependem de uma ação explícita.
