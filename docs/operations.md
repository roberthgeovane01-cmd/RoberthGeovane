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

## Incidente

1. confirmar o status HTTP público;
2. verificar o último deployment e os logs Vercel;
3. consultar logs de API, Auth, Storage e Postgres no Supabase;
4. interromper escrita ou processamento se houver risco de inconsistência;
5. corrigir por migração aditiva e validar antes de promover.
