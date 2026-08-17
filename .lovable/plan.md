# Fundo padrão na primeira página do PDF

Adicionar a sua imagem padrão de relatório como fundo da primeira página do PDF, com transparência para o texto continuar legível.

## O que muda

- A imagem enviada passa a ser o fundo da **página 1** do relatório, cobrindo a folha A4 inteira (210x297 mm), atrás de todo o conteúdo.
- Aplicada com opacidade reduzida (~12-15%), como marca d'água, para não atrapalhar a leitura de textos, status e fotos.
- As demais páginas seguem limpas, como hoje.
- O cabeçalho azul-petróleo atual da primeira página passa a ser semitransparente (ou é removido) para não cobrir a imagem — decido pelo resultado visual após ver a arte.

## Detalhes técnicos

- A imagem é enviada como asset do projeto e importada no gerador de PDF.
- Em `src/lib/pdf.ts`, antes de qualquer conteúdo: desenhar a imagem em (0,0) com 210x297 mm usando um `GState` com `opacity`, restaurando a opacidade normal em seguida.
- A proporção é ajustada para A4; se a arte não for A4, ela é encaixada preservando o formato (com margem branca ao redor, se necessário).
- Nenhuma alteração no fluxo do app, no armazenamento local nem nas telas.

## Pendência

Preciso que você anexe a imagem padrão (PNG ou JPG) na próxima mensagem — assim que ela chegar, aplico exatamente como descrito acima.
