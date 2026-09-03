# Roadmap de construção

| Fase | Entrega                                                  | Estado    |
| ---- | -------------------------------------------------------- | --------- |
| 0    | Inicialização, ferramentas e CI                          | concluída |
| 1    | Auth, banco, RLS, Storage e extensões                    | concluída |
| 2    | Biblioteca, upload e extração                            | concluída |
| 3    | Chunks, resumos, embeddings, conceitos e claims          | concluída |
| 4    | Retrieval lexical, vetorial, híbrido e reranking         | concluída |
| 5    | Evidências, conflitos, analista e dossiê                 | pendente  |
| 6    | Dataset fictício e avaliações                            | pendente  |
| 7    | UI completa de Biblioteca e Memória                      | pendente  |
| 8–14 | Áudio, mesa editorial, reflexão, estilo, voz e histórico | pendente  |
| 15   | Hardening                                                | pendente  |
| 16   | Deploy final, documentação e smoke tests                 | parcial   |

## Critérios fechados na Fase 2

- upload privado de PDF textual, DOCX, TXT e Markdown até 50 MB;
- upload padrão até 6 MB e retomável acima desse limite;
- registro de fonte e versão antes do envio;
- validação de extensão, MIME, assinatura e SHA-256;
- prevenção de duplicidade por hash no workspace;
- preservação do original no bucket `library-originals`;
- extração de texto e estrutura inicial em `source_sections`;
- PDF sem texto retido como `ocr_required`, sem entrar silenciosamente na memória;
- listagem, detalhe e download temporário autenticado;
- registro final do processamento em `processing_jobs`.

## Critérios fechados na Fase 3

- chunking determinístico que respeita seções, parágrafos e limites semânticos;
- hash, localizador, estimativa de tokens e versão do chunker em cada chunk;
- espaços de embedding que impedem mistura de provedor, modelo, dimensão e versão;
- prompts centralizados, versionados e protegidos contra instruções nas fontes;
- resumos por seção e fonte, conceitos candidatos e claims com evidência literal;
- processamento durável em lotes, com retomada, idempotência e progresso;
- consentimento explícito antes do envio do texto ao provedor de IA;
- painel de memória e estado detalhado por documento.

## Critérios fechados na Fase 4

- busca textual em português e busca vetorial filtrada pelo espaço de embedding;
- fusão por Reciprocal Rank Fusion entre resultados lexicais e semânticos;
- recuperação paralela nos níveis global, intermediário e de evidência;
- expansão determinística em até três consultas, sem antecipar o Query Planner;
- filtros por autor, tipo de fonte e autoridade mínima;
- reranqueamento por relevância, autoridade, validade temporal e especificidade;
- limite por fonte para preservar diversidade sem apagar divergências;
- persistência da sessão, consultas, candidatos, scores, selecionados e descartados;
- prova transacional com fontes fictícias, diversidade e hierarquia, seguida de rollback;
- testes de duplicidade, diversidade e prompt malicioso tratado como dado.

OCR automatizado permanece uma entrega posterior. A Fase 5 parte desses
resultados para classificar evidências, detectar conflitos e montar dossiês.
