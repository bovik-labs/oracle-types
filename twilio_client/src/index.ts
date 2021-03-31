import * as http from 'http';
import * as tiny from 'tiny-json-http';
import * as fs from 'fs';

type Config = {
  TWILIO_ACCOUNT_ID: string,
  TWILIO_PHONE_NUMBER_SRC: string,
  TWILIO_PHONE_NUMBER_DST: string,
  TWILIO_RELAY_SERVER: string,
  TWILIO_AUTH_TOKEN: string,
}

const twilio = require('twilio'); // @types/twilio seems to be obsolete?

const configFile = process.env['TWILIO_JSON'];
if (configFile == undefined) {
  throw "environment variable TWILIO_JSON should point to configuration file";
}
const config = JSON.parse(fs.readFileSync(configFile, 'utf8')) as Config;

const client = twilio(config.TWILIO_ACCOUNT_ID, config.TWILIO_AUTH_TOKEN);
const url = `http://${config.TWILIO_RELAY_SERVER}/listen`;
const args = process.argv.slice(2);

async function send_msg(msg: string): Promise<any> {
  return client.messages
    .create({
      from: config.TWILIO_PHONE_NUMBER_SRC,
      to: config.TWILIO_PHONE_NUMBER_DST,
      body: msg,
    });
}

async function go() {
  const msg = args[0];
  if (msg !== undefined && msg !== "") {
    await send_msg(msg);
  }
  // receive response
  const res = await tiny.get({ url });
  console.log(res.body.message);
}

go().catch(x => console.log(JSON.stringify({ error: x })));
