import { ParseJson } from './parse';
import format from 'pg-format';

import * as schema from '../../get_schema/src/schema';
import {
  Conn, DbClient, get_client, get_schema,
  DbSchema, TableSchema, TableSchemas, Column
} from '../../get_schema/src/schema';

// Given connection `C`, calls the `get_schema` script to get the
// schema of a postgresql database and returns a string literal type
// containing it as json.
type SchemaTxt<C extends Conn> =
  Shell<`node /tapeworm/get_schema/out/get_schema.js ${C['host']} ${C['port']} ${C['user']} ${C['db']}`>;

// Given connection `C`, returns a structured type extending JsonOutput
export type SchemaOf<C extends Conn> = ParseJson<SchemaTxt<C>>;

// Convert from a string describing a pg type to an appropriate typescript type
type Inhab<K> =
  K extends 'text' ? string :
  K extends 'integer' ? number :
  K;

// A temporary stub type standing in for a table type so that we don't
// get infinite recursion.
type Stub<T> = { stub: T };

// Given a single column type, return the type that should be the value
// part of the row record for that column.
type MakeColumn<T extends Column> = Inhab<T['data_type']>;

// Given a disjunction of columns, return the object type that is one row.
type DisjunctToRow<T extends Column> =
  { [K in T['column_name']]: MakeColumn<Extract<T, { column_name: K }>> };

// Given a single table's schema, return the typescript type of one row of that table.
type RowModel<S extends TableSchema> = DisjunctToRow<S['cols'][number]>;

type AsyncThunk<T> = () => Promise<T>;

type LookupStub<TS extends TableSchemas, TABLE> =
  TABLE extends keyof TS ? AsyncThunk<ProxiedRowModel<TS, TS[TABLE]>> : "couldn't find table reference";

type LookupStubs<TS extends TableSchemas, ROW extends { [k: string]: any }> =
  { [K in keyof ROW]: ROW[K] extends schema.Stub<infer TGT> ?
    LookupStub<TS, TGT> : ROW[K] };

// Given a single table's schema, return the typescript type of one row of that table,
// with proxies for foreign keys
type ProxiedRowModel<TS extends TableSchemas, S extends TableSchema> =
  LookupStubs<TS, RowModel<S>>;

// Given a database schema (for recursive lookups), and single table's
// schema, return the typescript type of one row of that table, with
// proxies for foreign keys.
type RowOfDb<DB extends DbSchema, S extends TableSchema> =
  ProxiedRowModel<DB['table_schemas'], S>;

// Given a single table's schema, return the typescript type of the utility class for that model
interface TableModel<DB extends DbSchema, S extends TableSchema> {
  findAll: () => Promise<RowOfDb<DB, S>[]>
}

// Given a database schema, return the typescript type of all utility classes for all models
type TableModels<DB extends DbSchema, S extends TableSchemas> = { [K in keyof S]: TableModel<DB, S[K]> };

// Impedance matching for uncertainty about whether json parsing
// actually produces something extending DbSchema
type ModelsI<DB> = DB extends DbSchema ? Models<DB> : unknown;

// Given a DbSchema, returns a class with getters for individual tables
class Models<DB extends DbSchema> {
  constructor(public client: DbClient, public schema: DB) {

  }

  get<K extends string & keyof DB['table_schemas']>(tableName: K): TableModel<DB, DB['table_schemas'][K]> {
    return new Model<DB, DB['table_schemas'][K]>(this, tableName);
  }
}

function is_foreign(data_type: any): data_type is schema.ForeignTable {
  return typeof data_type === 'object' && 'target_table' in data_type;
}

// Implement the utility class for a model
class Model<DB extends DbSchema, S extends TableSchema> implements TableModel<DB, S> {
  constructor(public models: Models<DB>, public name: string) { }

  proxyForeignKeys(row: RowModel<S>): RowOfDb<DB, S> {
    return new Proxy(row, {
      get: (target, prop) => {
        const found = this.models.schema.table_schemas[this.name].cols
          .find(col => col.column_name === prop && is_foreign(col.data_type));
        if (found && is_foreign(found.data_type)) {
          const dt = found.data_type;
          return async () => {
            const formatted = format(
              'select * from %I tgt where tgt.%I = %L',
              dt.target_table, dt.target_col, (row as any)[found.column_name]
            );
            const res = await this.models.client.query(formatted);
            return this.proxyForeignKeys(res.rows[0]);
          }
        }
        else {
          return (target as any)[prop];
        }
      }
    }) as any;
  }

  async findAll(): Promise<RowOfDb<DB, S>[]> {
    const res = await this.models.client.query(format('select * from %I', this.name));
    return res.rows.map(row => this.proxyForeignKeys(row)) as any;
  }
}

export async function getModels<C extends Conn>(conn: C): Promise<ModelsI<SchemaOf<C>>> {
  const client = get_client(conn);
  return new Models(client, await get_schema(client)) as any;
}

const connection = <const>{
  db: 'postgres',
  user: 'postgres',
  host: 'database',
  port: 5432
}
