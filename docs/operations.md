# Operações

## Verificações locais

```bash
npm ci
npm run check
npm run build
```

## Saúde

- `GET /`: deve responder 200 e mostrar “Memória Reflexiva” e “Supabase conectado”.
- `GET /api/health`: deve responder 200 com `status: ok`.
- Supabase Security Advisor deve permanecer sem alertas.
- Migrações locais e remotas devem possuir a mesma ordem lógica.

## Biblioteca

- formatos aceitos: PDF textual, DOCX, TXT e Markdown;
- limite funcional: 50 MB por arquivo;
- uploads acima de 6 MB usam o endpoint TUS direto do Storage;
- o bucket `library-originals` deve permanecer privado;
- `sha256` deve ser único por workspace;
- versões `ready` devem possuir hash verificado e, quando houver texto,
  `source_sections`;
- versões `ocr_required` devem preservar o original, não possuir seções ruins e
  aguardar OCR explícito;
- falhas ficam visíveis como `failed` e são registradas em `processing_jobs`.

## Incidente

1. confirmar o status HTTP público;
2. verificar o último deployment e os logs Vercel;
3. consultar logs de API, Auth, Storage e Postgres no Supabase;
4. interromper escrita ou processamento se houver risco de inconsistência;
5. corrigir por migração aditiva e validar antes de promover.
