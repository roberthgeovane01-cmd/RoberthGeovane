# Roadmap de construção

| Fase | Entrega                                                  | Estado    |
| ---- | -------------------------------------------------------- | --------- |
| 0    | Inicialização, ferramentas e CI                          | concluída |
| 1    | Auth, banco, RLS, Storage e extensões                    | concluída |
| 2    | Biblioteca, upload e extração                            | concluída |
| 3    | Chunks, resumos, embeddings, conceitos e claims          | próxima   |
| 4    | Retrieval lexical, vetorial, híbrido e reranking         | pendente  |
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

A Fase 3 transformará as seções preservadas em chunks versionados, resumos,
embeddings, conceitos e claims. OCR automatizado permanece uma entrega posterior.
