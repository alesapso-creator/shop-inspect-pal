# App de Inspeção de Loja (PWA Android)

App web instalável na tela inicial do Android, em português, para registrar inspeções de loja e gerar um PDF ao final. Tudo fica salvo no próprio aparelho.

## Fluxo

```text
Início (lista de inspeções salvas)
  └─ Nova inspeção
       ├─ Cabeçalho: Rede / Loja / Data / Técnico
       ├─ Grade de ícones das áreas:
       │    Balcão de Atendimento · Balcão de Autosserviço
       │    Câmara Fria · Área de Manipulação
       │    (toque numa área → formulário da área)
       ├─ Formulário da área:
       │    Status: Conforme / Parcialmente conforme / Não conforme
       │    Problemas encontrados (texto)
       │    Oportunidades (texto)
       │    Fotos (2 ou mais, câmera ou galeria)
       └─ Finalizar → gera PDF com todas as áreas preenchidas
```

## Telas

1. **Início** — lista das inspeções salvas no aparelho (rede, loja, data), botão "Nova inspeção", abrir para continuar/reabrir PDF, excluir.
2. **Nova inspeção** — campos de cabeçalho (data já preenchida com hoje) e a grade de ícones. Cada card de área mostra um selo de status quando já foi preenchida, para saber o que falta.
3. **Área** — seleção de status por três botões grandes com ícone e cor (verde / âmbar / vermelho), duas caixas de texto e o bloco de fotos com miniaturas e botão de remover. Salvar volta para a grade.
4. **Finalizar** — resumo rápido e botão "Gerar PDF".

## PDF

- Capa com Rede, Loja, Data, Técnico e resumo dos status por área.
- Uma seção por área preenchida: status colorido, problemas, oportunidades e as fotos (2 por linha, redimensionadas).
- Nome do arquivo: `inspecao-<loja>-<data>.pdf`, baixado direto no celular e também compartilhável.

## Detalhes técnicos

- Rotas TanStack: `/` (lista), `/inspecao/nova`, `/inspecao/$id`, `/inspecao/$id/area/$areaId`.
- Persistência local com IndexedDB (fotos como Blob, sem estourar o limite do localStorage); estado do formulário salvo automaticamente a cada mudança.
- Fotos: `input[type=file] capture` + compressão via canvas (máx. ~1600px, JPEG) antes de guardar.
- PDF gerado no cliente com `jspdf` — sem servidor, funciona offline.
- Instalável: `manifest.webmanifest` + ícones + tags no `head` do root (sem service worker, apenas ícone na tela inicial).
- Visual: interface mobile-first, alvos de toque grandes, paleta e tokens semânticos definidos em `src/styles.css` (tema de campo: azul-petróleo + cinzas, status em verde/âmbar/vermelho). Ícones do lucide-react.
- Título/descrição de SEO próprios por rota.
