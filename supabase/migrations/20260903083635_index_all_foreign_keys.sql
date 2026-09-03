-- Every referencing side of a foreign key receives a covering btree index.
-- This protects joins and avoids full-table scans when parent rows are changed.

do $$
declare
  foreign_key record;
  index_name text;
  quoted_columns text;
begin
  for foreign_key in
    with foreign_keys as (
      select
        constraint_row.conrelid,
        namespace_row.nspname as schema_name,
        table_row.relname as table_name,
        constraint_row.conname,
        constraint_row.conkey,
        array_agg(attribute_row.attname order by key_row.ordinality) as columns
      from pg_constraint constraint_row
      join pg_class table_row on table_row.oid = constraint_row.conrelid
      join pg_namespace namespace_row on namespace_row.oid = table_row.relnamespace
      join unnest(constraint_row.conkey) with ordinality key_row(attnum, ordinality) on true
      join pg_attribute attribute_row
        on attribute_row.attrelid = constraint_row.conrelid
       and attribute_row.attnum = key_row.attnum
      where constraint_row.contype = 'f'
        and namespace_row.nspname = 'public'
        and table_row.relname <> 'todos'
      group by
        constraint_row.conrelid,
        namespace_row.nspname,
        table_row.relname,
        constraint_row.conname,
        constraint_row.conkey
    )
    select foreign_keys.*
    from foreign_keys
    where not exists (
      select 1
      from pg_index index_row
      where index_row.indrelid = foreign_keys.conrelid
        and index_row.indisvalid
        and (index_row.indkey::smallint[])[0:cardinality(foreign_keys.conkey)-1] = foreign_keys.conkey
    )
    order by table_name, conname
  loop
    index_name := left(
      foreign_key.table_name || '_' || array_to_string(foreign_key.columns, '_') || '_fk_idx',
      63
    );

    select string_agg(quote_ident(column_name), ', ')
      into quoted_columns
      from unnest(foreign_key.columns) column_name;

    execute format(
      'create index %I on %I.%I (%s)',
      index_name,
      foreign_key.schema_name,
      foreign_key.table_name,
      quoted_columns
    );
  end loop;
end;
$$;
