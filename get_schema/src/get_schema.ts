// node /tapeworm/get_schema/out/get_schema.js database 5432 postgres postgres

import { Conn, get_schema, get_client } from './schema';

async function main() {
  const args = process.argv.slice(2); // chop off node and get_schema.js

  const conn: Conn = {
    host: args[0],
    port: Number(args[1]),
    user: args[2],
    db: args[3]
  };

  const schema = await get_schema(get_client(conn));
  console.log(JSON.stringify(schema));
  process.exit(0);
}

main().catch(console.error);
