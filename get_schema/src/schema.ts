import { Client } from 'pg';

// A type representing postgres connection information
export type Conn = {
  db: string,
  user: string,
  host: string,
  port: number
};

export type Stub<TGT> = { target_table: TGT };
export type ForeignTable = { tp: 'foreign', target_col: string, target_table: string };

export type Column = {
  column_name: string,
  data_type: 'integer' | 'text' | ForeignTable,
  is_nullable: 'YES' | 'NO',
};

export type TableSchema = {
  cols: Column[]
}

export type TableSchemas = {
  [name: string]: TableSchema
}

type ForeignKeyConstraint = {
  source_table: string,
  source_col: string,
  target_table: string,
  target_col: string
};

export type TableForeignKeyMap = {
  [source_col: string]:
  { target_table: string, target_col: string }
};

export type ForeignKeyMap = {
  [source_table: string]: TableForeignKeyMap
};

export type DbSchema = {
  table_schemas: TableSchemas,
}

export type DbClient = Client;

export function get_client(conn: Conn): DbClient {
  return new Client({
    host: conn.host,
    port: conn.port,
    user: conn.user,
    database: conn.db
  });
}

const foreign_key_query = `
SELECT
  tc.table_name as source_table,
  kcu.column_name AS source_col,
  ccu.table_name as target_table,
  ccu.column_name as target_col
FROM
  information_schema.table_constraints as tc
JOIN information_schema.key_column_usage as kcu
  ON tc.table_schema = kcu.table_schema
     AND tc.table_name = kcu.table_name
     AND tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage as ccu
  ON tc.table_schema = ccu.table_schema
     AND tc.constraint_name = ccu.constraint_name
WHERE
  tc.constraint_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY';
`;

const column_type_query = `
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
`;

async function get_column_types(client: Client): Promise<TableSchemas> {
  const res = await client.query(column_type_query);
  const table_schemas: TableSchemas = {};
  res.rows.forEach((row: any) => {
    const { table_name, column_name, data_type, is_nullable } = row;
    table_schemas[table_name] ||= { cols: [] };
    table_schemas[table_name].cols.push({ column_name, data_type, is_nullable });
  });
  return table_schemas;
}

async function get_foreign_keys(client: Client): Promise<ForeignKeyConstraint[]> {
  return (await client.query(foreign_key_query)).rows;
}

export async function get_schema(client: Client): Promise<DbSchema> {
  await client.connect();

  const table_schemas = await get_column_types(client);
  const fkeys = await get_foreign_keys(client);

  fkeys.forEach(row => {
    table_schemas[row.source_table].cols.forEach(col => {
      if (col.column_name == row.source_col)
        col.data_type = { tp: 'foreign', target_col: row.target_col, target_table: row.target_table };
    });
  });

  return { table_schemas };
}
