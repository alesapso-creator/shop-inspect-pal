# Papel timbrado Friboi+ na primeira página do PDF

A imagem enviada é um timbre (faixa azul com o logo Friboi+ no topo e o restante da folha em branco). Ela passa a ser o fundo da primeira página do relatório.

## O que muda

- Página 1 do PDF passa a ter o timbre Friboi+ como fundo, cobrindo a folha A4 inteira.
- O cabeçalho azul-petróleo atual (faixa com "Relatório de Inspeção de Loja") é removido da página 1, para não cobrir a arte. O título e a data de geração passam a ser escritos em texto escuro logo abaixo da faixa azul do timbre.
- O conteúdo da primeira página começa mais abaixo (~55 mm do topo), respeitando a área da arte.
- Como a faixa é forte no topo mas o corpo da folha é branco, o timbre entra em opacidade cheia na faixa; caso alguma foto ou texto caia sobre uma parte colorida, aplico uma leve transparência (~15%) só nessa sobreposição para manter a leitura.
- As demais páginas continuam limpas, com o rodapé de paginação atual.

## Detalhes técnicos

- A imagem é publicada como asset do projeto (pointer `.asset.json`) e carregada como data URL no momento de gerar o PDF, para o `jspdf` conseguir embuti-la offline.
- Em `src/lib/pdf.ts`: desenhar a imagem em (0,0) com 210x297 mm antes de qualquer conteúdo da página 1, usando `GState` quando precisar de transparência; ajustar o `y` inicial e remover o retângulo azul-petróleo do topo.
- `buildInspectionPdf` passa a ser assíncrono (carregamento da imagem), com ajuste nos chamadores em `src/routes/inspecao.$id.tsx` e nas funções de download/compartilhar.
- Nenhuma mudança nas telas, no armazenamento local ou no fluxo do app.
