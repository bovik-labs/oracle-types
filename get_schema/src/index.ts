const args = process.argv.slice(2); // chop off node and index.ts

import { Client } from 'pg';
const client = new Client({
  host: args[0],
  port: Number(args[1]),
  user: args[2],
  database: args[3]
});

async function main() {
  await client.connect();
  const query = `select column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name = '${args[4]}'`;
  const res = await client.query(query);
  console.log(JSON.stringify({rows: res.rows, args}));
  await client.end()
}

main().catch(console.error).then((x) => console.error('done'));
