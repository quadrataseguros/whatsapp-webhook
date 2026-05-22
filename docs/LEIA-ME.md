# Documentos de Produtos — Quadrata Seguros

Coloque aqui os PDFs que a MarIAna usará para responder perguntas dos clientes.
Cada subpasta corresponde a um produto. Use nomes claros.

## Estrutura

```
docs/
├── auto/
│   ├── condicoes-gerais-porto.pdf
│   ├── condicoes-gerais-allianz.pdf
│   └── condicoes-gerais-tokio.pdf
│
├── residencial/
│   └── condicoes-gerais-residencial.pdf
│
├── saude/
│   └── plano-saude-bradesco.pdf
│
├── emprestimo/
│   └── tabela-simulacao-emprestimo.pdf
│
└── consorcio/
    └── regulamento-consorcio.pdf
```

## Como indexar (uma vez por PDF novo)

```bash
# Indexa tudo de uma vez
npm run index:docs

# Ou por produto
npm run index:docs:auto
npm run index:docs:saude
```

## Por que subpastas?

O indexador lê a subpasta e adiciona um metadado `product` a cada trecho.
Isso permite que o Langflow filtre: ao perguntar sobre seguro auto,
só os trechos de `auto/` são recuperados — mais rápido e mais preciso.

## Configuração no Langflow (obrigatória)

Crie um flow de indexação com estes componentes:

```
[File Loader]
     ↓
[RecursiveCharacterTextSplitter]
   chunk_size:    700
   chunk_overlap: 120
     ↓
[OpenAI Embeddings]
   model: text-embedding-3-small
     ↓
[Vector Store]  ← Chroma (local) ou pgvector (produção)
```

Depois crie/atualize o flow de consulta (Atendente/Vendedor/Secretária):

```
[Chat Input]
     ↓
[Vector Store Retriever]
   top_k: 4
     ↓
[Prompt]  ← injeta os trechos recuperados no contexto
     ↓
[LLM]
     ↓
[Chat Output]
```

Copie o ID do flow de indexação para LANGFLOW_FLOW_ID_RAG no .env.
