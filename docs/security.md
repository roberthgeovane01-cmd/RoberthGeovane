# Segurança

## Isolamento

As 39 tabelas têm Row Level Security habilitado. Usuários autenticados só leem
workspaces dos quais participam. Escrita exige papel `owner`, `admin` ou `member`;
o papel `viewer` é somente leitura. Administração de membros e prompts exige
`owner` ou `admin`.

As funções auxiliares `security definer` ficam no schema não exposto `private`,
fixam `search_path` vazio e validam `auth.uid()`. Nenhuma decisão de autorização
usa `user_metadata`.

## Storage

Os buckets `library-originals`, `audio-originals` e `audio-generated` são
privados. O primeiro segmento do caminho deve ser o UUID do workspace. Policies
de Storage aplicam a mesma associação e impedem leitura anônima.

## Chaves

Somente URL e chave publicável usam `NEXT_PUBLIC_`. Chaves secretas e
`service_role` nunca entram no navegador ou no repositório.
