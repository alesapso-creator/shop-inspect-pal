# Ajustar timbre e fotos do PDF de rendimento

## O que muda
- Aumentar moderadamente o Friboi+ no canto superior esquerdo, mantendo espaço para o primeiro rendimento.
- Corrigir as fotos adicionadas para preservar sua proporção original, sem esticar na vertical.
- Manter as fotos compactas para que as informações do primeiro rendimento continuem cabendo na primeira página sempre que possível.

## Detalhes técnicos
- Ajustar o tamanho e o posicionamento do timbre em `src/lib/rendimento-pdf.ts`.
- Calcular largura e altura de cada foto pela proporção original, limitando ambas ao espaço disponível e centralizando a imagem em sua coluna.
- Gerar e conferir visualmente um PDF com fotos em formatos diferentes.
